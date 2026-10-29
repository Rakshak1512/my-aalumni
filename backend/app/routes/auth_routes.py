from flask import Blueprint, request, g
from app.auth.decorators import require_auth
from app.repositories.user_repository import UserRepository
from app.services.email_service import EmailService
from app.utils.responses import success_response, error_response
from app.utils.audit import log_audit_event
from app.validators.validators import validate_user_provision, validate_email

auth_bp = Blueprint('auth', __name__)
user_repo = UserRepository()


DEMO_ROLE_MAP = {
    "admin.demo@myalumni.test": "admin",
    "faculty.demo@myalumni.test": "faculty",
    "student.demo@myalumni.test": "student",
    "alumni.demo@myalumni.test": "alumni",
    "admin@myalumni.edu": "admin",
    "faculty@myalumni.edu": "faculty",
    "student@myalumni.edu": "student",
    "alumni@myalumni.edu": "alumni",
    "admin": "admin",
    "faculty": "faculty",
    "student": "student",
    "alumni": "alumni"
}


@auth_bp.route('/auth/demo-login', methods=['POST'])
def demo_login():
    """Legacy demo bypass is disabled; use provisioned Firebase demo accounts with email OTP."""
    return error_response(
        "Passwordless demo bypass is disabled. Provision the demo account in Firebase and use email OTP.",
        "DEMO_BYPASS_DISABLED",
        403
    )


@auth_bp.route('/auth/otp/request', methods=['POST'])
def request_email_otp():
    """Send a short-lived six-digit OTP for login, registration, or password reset."""
    from firebase_admin import auth as firebase_auth
    from app.firebase import get_auth_client
    from app.services.otp_service import request_otp
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    purpose = (data.get('purpose') or '').strip().lower()
    if purpose not in ('login', 'register', 'reset'):
        return error_response("Purpose must be login, register, or reset.", "INVALID_PURPOSE", 400)
    valid, validation_error = validate_email(email)
    if not valid:
        return error_response(validation_error, "INVALID_EMAIL", 400)
    try:
        auth_client = get_auth_client()
        try:
            existing = auth_client.get_user_by_email(email)
            exists = existing is not None
        except firebase_auth.UserNotFoundError:
            exists = False
        if purpose == 'register' and exists:
            return error_response("An account already exists for this email. Choose sign in instead.", "EMAIL_EXISTS", 409)
        if purpose in ('login', 'reset') and not exists:
            # Generic message avoids disclosing account existence.
            return success_response({"expiresInSeconds": 600}, message="If the account is eligible, a code will be sent.")
        result = request_otp(email, purpose)
        return success_response(result, message="A six-digit verification code was sent if SMTP is configured.")
    except Exception as exc:
        return error_response(str(exc) if Config.APP_ENV != 'production' else "Could not send a code. Please try again later.", "OTP_SEND_FAILED", 503)


@auth_bp.route('/auth/otp/verify', methods=['POST'])
def verify_email_otp():
    """Verify OTP and complete login, registration, or password reset using Firebase Admin."""
    from app.firebase import get_auth_client
    from app.services.otp_service import verify_otp
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    purpose = (data.get('purpose') or '').strip().lower()
    code = str(data.get('code') or '').strip()
    if purpose not in ('login', 'register', 'reset') or len(code) != 6 or not code.isdigit():
        return error_response("Enter a valid six-digit code.", "INVALID_OTP", 400)
    valid, validation_error = validate_email(email)
    if not valid:
        return error_response(validation_error, "INVALID_EMAIL", 400)
    try:
        accepted, reason = verify_otp(email, purpose, code)
        if not accepted:
            return error_response(reason or "Code is invalid or expired.", "OTP_INVALID", 400)
        auth_client = get_auth_client()
        if purpose == 'register':
            password = data.get('password') or ''
            display_name = (data.get('displayName') or '').strip()
            requested_role = (data.get('role') or 'student').lower()
            if len(password) < 8 or not display_name:
                return error_response("Name and a password of at least 8 characters are required.", "INVALID_REGISTRATION", 400)
            if requested_role not in ('student', 'alumni'):
                requested_role = 'student'
            user = auth_client.create_user(email=email, password=password, display_name=display_name, email_verified=True)
            uid = user.uid
            profile = data.get('profile') if isinstance(data.get('profile'), dict) else {}
            user_payload = {
                "uid": uid, "email": email, "displayName": display_name,
                "role": requested_role, "accountStatus": "active",
                "emailVerified": True, "bio": ""
            }
            user_repo.create(user_payload, doc_id=uid)
            if profile:
                user_repo.update_role_profile(uid, requested_role, profile)
        elif purpose == 'reset':
            password = data.get('newPassword') or ''
            if len(password) < 8:
                return error_response("New password must contain at least 8 characters.", "INVALID_PASSWORD", 400)
            user = auth_client.get_user_by_email(email)
            auth_client.update_user(user.uid, password=password)
            uid = user.uid
        else:
            user = auth_client.get_user_by_email(email)
            uid = user.uid
        custom_token = auth_client.create_custom_token(uid).decode('utf-8')
        return success_response({"customToken": custom_token, "uid": uid}, message="Verification successful.")
    except Exception as exc:
        # Do not expose provider internals or secrets to production clients.
        from app.config import Config
        message = str(exc) if Config.APP_ENV != 'production' else "Verification could not be completed. Please try again."
        return error_response(message, "OTP_VERIFY_FAILED", 400)


@auth_bp.route('/auth/check-email', methods=['POST'])
def check_email():
    """Validates email format before authentication requests."""
    data = request.get_json() or {}
    email = data.get('email', '')
    is_valid, err = validate_email(email)
    if not is_valid:
        return error_response(err, "INVALID_EMAIL", 400)
    return success_response({"email": email, "isValid": True}, message="Email format is valid.")

