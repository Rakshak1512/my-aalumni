from flask import Blueprint
from app.firebase import get_firebase_status
from app.utils.responses import success_response

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint."""
    return success_response({
        "status": "healthy",
        "service": "MyAlumni 2.0 Backend API",
        "version": "2.0.0"
    }, message="API service is operating normally.")


@health_bp.route('/health/firebase', methods=['GET'])
def firebase_health_check():
    """Detailed Firebase Admin SDK and Cloud Firestore health check."""
    status = get_firebase_status()
    is_ok = status.get('initialized', False)
    code = 200 if is_ok else 503
    msg = "Firebase Admin SDK operational." if is_ok else "Firebase configuration incomplete or unreachable."
    return success_response(status, message=msg, status_code=code)

