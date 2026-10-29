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
    """
    Direct instant login for demo test roles without requiring Firebase Auth credentials.
    Supports Admin, Faculty, Student, and Alumni demonstration personas.
    """
    data = request.get_json() or {}
    key = (data.get('role') or data.get('email') or '').lower().strip()
    role = DEMO_ROLE_MAP.get(key)

    if not role:
        return error_response(f"Invalid demo persona '{key}'. Available demo roles: admin, faculty, student, alumni.", "INVALID_DEMO_USER", 400)

    from app.auth.decorators import DEMO_ACCOUNTS
    demo_spec = DEMO_ACCOUNTS[role]
    uid = demo_spec['uid']

    # Retrieve user profile from Cloud Firestore
    user = user_repo.get_user_with_profile(uid)
    if not user:
        # If not yet seeded in Firestore, create default demo record
        user_payload = {
            "uid": uid,
            "email": demo_spec['email'],
            "displayName": demo_spec['displayName'],
            "role": role,
            "accountStatus": "active",
            "bio": f"Verified {role.title()} demo account on MyAlumni 2.0."
        }
        user = user_repo.create(user_payload, doc_id=uid)
        user['profile'] = {}

    token = f"demo-token-{role}"
    log_audit_event(
        action="DEMO_USER_LOGIN",
        actor_id=uid,
        actor_email=demo_spec['email'],
        actor_role=role,
        target_type="session",
        target_id=uid,
        details={"login_type": "no_auth_demo"}
    )

    return success_response({
        "user": user,
        "token": token,
        "role": role
    }, message=f"Signed in successfully as {role.title()} Demo (No password required).")


@auth_bp.route('/auth/sync-profile', methods=['POST'])
@require_auth
def sync_profile():
    """
    Syncs or creates the user record in Cloud Firestore after Firebase Auth signup/login.
    Prevents client-side self-elevation to admin or faculty.
    """
    current = g.current_user
    uid = current['uid']
    email = current.get('email', '')

    data = request.get_json() or {}
    display_name = data.get('displayName', '').strip() or email.split('@')[0]
    requested_role = (data.get('role') or 'student').lower()

    # Security check: Never allow client to register as admin or faculty directly
    existing_user = user_repo.get_by_id(uid)
    if existing_user:
        # User already exists - keep existing role
        final_role = existing_user.get('role', 'student')
        account_status = existing_user.get('accountStatus', 'active')
    else:
        # New user
        if requested_role in ('admin', 'faculty'):
            # Reject self-assigned admin/faculty
            final_role = 'student'
        elif requested_role in ('student', 'alumni'):
            final_role = requested_role
        else:
            final_role = 'student'
        account_status = 'active'

    user_payload = {
        "uid": uid,
        "email": email,
        "displayName": display_name,
        "role": final_role,
        "accountStatus": account_status,
        "avatarUrl": data.get('avatarUrl', ''),
        "bio": data.get('bio', ''),
        "phone": data.get('phone', ''),
    }

    user = user_repo.create(user_payload, doc_id=uid)

    # Initialize role-specific profile document if provided
    role_profile = data.get('profile', {})
    if role_profile:
        user_repo.update_role_profile(uid, final_role, role_profile)

    # Send welcome email via SMTP if this is a newly provisioned account
    if not existing_user and email:
        EmailService.send_welcome_email(email, display_name, final_role)

    log_audit_event(
        action="USER_SYNC_PROFILE",
        actor_id=uid,
        actor_email=email,
        actor_role=final_role,
        target_type="user",
        target_id=uid,
        details={"role": final_role, "status": account_status}
    )

    full_user = user_repo.get_user_with_profile(uid)
    return success_response(full_user, message="Profile synced successfully.", status_code=200)


@auth_bp.route('/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """Returns the authenticated user's record and role-specific profile."""
    uid = g.current_user['uid']
    user = user_repo.get_user_with_profile(uid)
    if not user:
        return error_response("User profile not found. Please sync profile.", "PROFILE_NOT_FOUND", 404)
    return success_response(user, message="Current user profile retrieved.")


@auth_bp.route('/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Logs the user logout action for security auditing."""
    uid = g.current_user.get('uid')
    log_audit_event(
        action="USER_LOGOUT",
        actor_id=uid,
        actor_email=g.current_user.get('email'),
        actor_role=g.current_user.get('role'),
        target_type="session",
        target_id=uid
    )
    return success_response(None, message="Logged out successfully.")



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

