import os
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore, auth, storage

from app.config import Config

logger = logging.getLogger('myalumni.firebase')

_firebase_app: Optional[firebase_admin.App] = None
_firestore_client = None
_initialization_error: Optional[str] = None
_initialization_details: Dict[str, Any] = {}


class FirebaseNotConfiguredError(Exception):
    """Raised when Firebase service is required but credentials/connection are missing or invalid."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


def init_firebase() -> Tuple[bool, Optional[str]]:
    """
    Initializes the Firebase Admin SDK using configured credentials.
    Returns (success: bool, error_message: Optional[str]).
    Never silently falls back to local or in-memory stores.
    """
    global _firebase_app, _firestore_client, _initialization_error, _initialization_details

    if _firebase_app is not None:
        return True, None

    cred_path = Config.get_firebase_credentials_resolved_path()
    raw_json = Config.FIREBASE_CREDENTIALS_JSON
    project_id = Config.FIREBASE_PROJECT_ID

    _initialization_details = {
        'project_id_configured': bool(project_id),
        'credentials_path_configured': bool(cred_path),
        'credentials_file_found': bool(cred_path and Path(cred_path).exists()),
        'credentials_json_configured': bool(raw_json),
    }

    cred = None

    try:
        # Check if already initialized by a default app in the process
        try:
            _firebase_app = firebase_admin.get_app()
            _firestore_client = firestore.client()
            logger.info("Firebase Admin app already initialized.")
            return True, None
        except ValueError:
            pass

        # 1. Try credentials path
        if cred_path and Path(cred_path).exists():
            try:
                cred = credentials.Certificate(cred_path)
                logger.info(f"Loaded Firebase service account credentials from {cred_path}")
            except Exception as e:
                _initialization_error = f"Invalid service account JSON file at '{cred_path}': {str(e)}"
                logger.error(_initialization_error)
                return False, _initialization_error

        # 2. Try raw JSON string
        elif raw_json:
            try:
                cred_dict = json.loads(raw_json)
                cred = credentials.Certificate(cred_dict)
                logger.info("Loaded Firebase service account credentials from FIREBASE_CREDENTIALS_JSON env.")
            except Exception as e:
                _initialization_error = f"Invalid FIREBASE_CREDENTIALS_JSON format: {str(e)}"
                logger.error(_initialization_error)
                return False, _initialization_error

        # 3. Check for missing credentials
        else:
            _initialization_error = (
                f"Missing Firebase credentials. Service account key file not found at '{cred_path}'. "
                "Set FIREBASE_CREDENTIALS_PATH or place firebase-service-account.json in the project root/backend directory. "
                "See docs/FIREBASE_SETUP.md for instructions."
            )
            logger.warning(_initialization_error)
            return False, _initialization_error

        options = {}
        if project_id:
            options['projectId'] = project_id
        if Config.FIREBASE_STORAGE_BUCKET:
            options['storageBucket'] = Config.FIREBASE_STORAGE_BUCKET

        _firebase_app = firebase_admin.initialize_app(cred, options)
        _firestore_client = firestore.client()
        logger.info("Firebase Admin SDK successfully initialized with Cloud Firestore.")
        return True, None

    except Exception as e:
        _initialization_error = f"Firebase initialization failed: {str(e)}"
        logger.error(_initialization_error, exc_info=True)
        return False, _initialization_error


def get_firestore_client():
    """
    Returns the initialized Cloud Firestore client or raises FirebaseNotConfiguredError.
    Strictly prevents silent fallback to SQLite or memory.
    """
    global _firestore_client
    if _firestore_client is None:
        success, err = init_firebase()
        if not success or _firestore_client is None:
            raise FirebaseNotConfiguredError(
                message=_initialization_error or "Cloud Firestore is not initialized or unreachable.",
                details=_initialization_details
            )
    return _firestore_client


def get_auth_client():
    """Returns the firebase_admin.auth module or raises FirebaseNotConfiguredError."""
    if _firebase_app is None:
        success, err = init_firebase()
        if not success:
            raise FirebaseNotConfiguredError(
                message=_initialization_error or "Firebase Auth is not initialized.",
                details=_initialization_details
            )
    return auth


def get_storage_bucket():
    """Returns the configured Firebase Storage bucket or raises FirebaseNotConfiguredError."""
    if _firebase_app is None:
        success, err = init_firebase()
        if not success:
            raise FirebaseNotConfiguredError(
                message=_initialization_error or "Firebase Storage is not initialized.",
                details=_initialization_details
            )
    return storage.bucket()


def verify_firebase_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verifies a Firebase ID token sent from the client.
    Returns decoded token dictionary containing 'uid', 'email', etc.
    """
    auth_module = get_auth_client()
    try:
        decoded_token = auth_module.verify_id_token(id_token, check_revoked=False)
        return decoded_token
    except Exception as e:
        logger.warning(f"Firebase ID token verification failed: {str(e)}")
        raise


def get_firebase_status() -> Dict[str, Any]:
    """Provides a detailed diagnostic report on Firebase health."""
    cred_path = Config.get_firebase_credentials_resolved_path()
    return {
        "initialized": _firebase_app is not None,
        "project_id": Config.FIREBASE_PROJECT_ID or None,
        "credentials_path": cred_path,
        "credentials_file_exists": bool(cred_path and Path(cred_path).exists()),
        "error": _initialization_error,
        "details": _initialization_details,
        "instructions": (
            "Ensure a valid Firebase service account JSON is located at 'firebase-service-account.json' "
            "and project settings are configured in backend/.env. Consult docs/FIREBASE_SETUP.md."
        ) if _firebase_app is None else "Firebase Admin SDK operational."
    }

