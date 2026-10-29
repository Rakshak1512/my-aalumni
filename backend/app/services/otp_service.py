"""Short-lived, single-use email OTPs for login, registration, and password reset."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from app.firebase import get_firestore_client
from app.services.email_service import EmailService

COLLECTION = "authOtps"
OTP_TTL_MINUTES = 10
MAX_ATTEMPTS = 5


def _doc_id(email: str, purpose: str) -> str:
    normalized = email.strip().lower()
    return hashlib.sha256(f"{purpose}:{normalized}".encode("utf-8")).hexdigest()


def request_otp(email: str, purpose: str):
    db = get_firestore_client()
    code = f"{secrets.randbelow(1_000_000):06d}"
    now = datetime.now(timezone.utc)
    doc_id = _doc_id(email, purpose)
    # Only the hash is persisted; the plaintext OTP is sent by email and never logged.
    code_hash = hashlib.sha256(f"{doc_id}:{code}".encode("utf-8")).hexdigest()
    ref = db.collection(COLLECTION).document(doc_id)
    ref.set({
        "email": email.strip().lower(),
        "purpose": purpose,
        "codeHash": code_hash,
        "expiresAt": now + timedelta(minutes=OTP_TTL_MINUTES),
        "attempts": 0,
        "createdAt": now,
        "consumed": False,
    })
    sent, error = EmailService.send_otp_email(email.strip().lower(), code, purpose, OTP_TTL_MINUTES)
    if not sent:
        ref.delete()
        raise RuntimeError(error or "Unable to send verification code. Check SMTP configuration.")
    return {"expiresInSeconds": OTP_TTL_MINUTES * 60}


def verify_otp(email: str, purpose: str, code: str):
    db = get_firestore_client()
    doc_id = _doc_id(email, purpose)
    ref = db.collection(COLLECTION).document(doc_id)
    snap = ref.get()
    if not snap.exists:
        return False, "Code is invalid or expired."
    data = snap.to_dict() or {}
    now = datetime.now(timezone.utc)
    expires = data.get("expiresAt")
    if data.get("consumed") or not expires or expires <= now:
        ref.delete()
        return False, "Code is invalid or expired."
    attempts = int(data.get("attempts", 0))
    if attempts >= MAX_ATTEMPTS:
        ref.delete()
        return False, "Too many incorrect attempts. Request a new code."
    candidate = hashlib.sha256(f"{doc_id}:{code}".encode("utf-8")).hexdigest()
    if not hmac.compare_digest(candidate, str(data.get("codeHash", ""))):
        ref.update({"attempts": attempts + 1})
        return False, "Incorrect verification code."
    # Single use: delete after successful verification.
    ref.delete()
    return True, None
