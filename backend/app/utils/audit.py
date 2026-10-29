import datetime
import logging
from flask import request
from typing import Optional, Dict, Any

from app.firebase import get_firestore_client, FirebaseNotConfiguredError

logger = logging.getLogger('myalumni.audit')


def log_audit_event(
    action: str,
    actor_id: str,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    status: str = "SUCCESS"
):
    """
    Records an immutable audit event in Firestore 'auditLogs'.
    Never throws in production to avoid crashing primary transaction, but logs error.
    """
    try:
        db = get_firestore_client()
        ip_address = request.remote_addr if request else "system"
        user_agent = request.headers.get('User-Agent', 'unknown') if request else "system"

        event = {
            "action": action,
            "actorId": actor_id,
            "actorEmail": actor_email,
            "actorRole": actor_role,
            "targetType": target_type,
            "targetId": target_id,
            "details": details or {},
            "status": status,
            "ipAddress": ip_address,
            "userAgent": user_agent,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
        }

        db.collection('auditLogs').add(event)
        logger.info(f"Audit log: [{action}] by actor {actor_id} on {target_type}:{target_id}")
    except FirebaseNotConfiguredError:
        logger.warning(f"Audit log skipped (Firebase not configured): {action} by {actor_id}")
    except Exception as e:
        logger.error(f"Failed to record audit log: {str(e)}", exc_info=True)

