import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env if present
env_path = Path(__file__).resolve().parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Config:
    APP_ENV = os.getenv('APP_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', '0') in ('1', 'true', 'True')
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'myalumni_default_secret_key_change_in_production')

    BACKEND_HOST = os.getenv('BACKEND_HOST', '127.0.0.1')
    BACKEND_PORT = int(os.getenv('BACKEND_PORT', '5000'))

    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://127.0.0.1:5000')

    # Allowed CORS Origins
    _raw_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,https://*.trycloudflare.com')
    ALLOWED_ORIGINS = []
    import re
    for _orig in _raw_origins.split(','):
        _orig = _orig.strip()
        if not _orig:
            continue
        if '*' in _orig:
            _pat = re.escape(_orig).replace(r'\*', '.*')
            ALLOWED_ORIGINS.append(re.compile(f"^{_pat}$"))
        else:
            ALLOWED_ORIGINS.append(_orig)
    # Always allow Cloudflare tunnel URLs by default
    ALLOWED_ORIGINS.append(re.compile(r"^https://.*\.trycloudflare\.com$"))
    if FRONTEND_URL and FRONTEND_URL not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(FRONTEND_URL)

    # Firebase
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', '')
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', './firebase-service-account.json')
    FIREBASE_CREDENTIALS_JSON = os.getenv('FIREBASE_CREDENTIALS_JSON', '')
    FIREBASE_STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET', '')

    # SMTP Settings
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', '')
    SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() in ('true', '1', 'yes')

    # Upload & Seeding
    UPLOAD_MAX_SIZE_MB = int(os.getenv('UPLOAD_MAX_SIZE_MB', '10'))
    DEMO_SEEDING_ENABLED = os.getenv('DEMO_SEEDING_ENABLED', 'false').lower() in ('true', '1', 'yes')
    DEMO_PASSWORD = os.getenv('DEMO_PASSWORD', 'Demo@MyAlumni2026!')

    @classmethod
    def is_production(cls):
        return cls.APP_ENV.lower() == 'production'

    @classmethod
    def get_firebase_credentials_resolved_path(cls):
        if not cls.FIREBASE_CREDENTIALS_PATH:
            return None
        p = Path(cls.FIREBASE_CREDENTIALS_PATH)
        if p.is_absolute() and p.exists():
            return str(p)

        # 1. Check relative to backend directory (backend/)
        backend_dir = Path(__file__).resolve().parent.parent
        if (backend_dir / p).exists():
            return str((backend_dir / p).resolve())

        # 2. Check relative to project root (e.g. MyAlumni/)
        root_dir = backend_dir.parent
        if (root_dir / p).exists():
            return str((root_dir / p).resolve())

        # 3. Check relative to current working directory
        cwd_path = Path.cwd() / p
        if cwd_path.exists():
            return str(cwd_path.resolve())

        return str((backend_dir / p).resolve())

