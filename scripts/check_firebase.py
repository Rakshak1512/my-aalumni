import sys
from pathlib import Path

# Add backend directory to sys.path so app modules can be loaded
backend_dir = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_dir))

from app.config import Config
from app.firebase import init_firebase, get_firebase_status, get_firestore_client


def run_check():
    print("==================================================")
    print("  MyAlumni 2.0 — Firebase Configuration Check")
    print("==================================================")
    
    cred_path = Config.get_firebase_credentials_resolved_path()
    print(f"Project ID configured      : {Config.FIREBASE_PROJECT_ID or 'Not Set'}")
    print(f"Credentials path           : {cred_path or 'Not Set'}")
    file_exists = bool(cred_path and Path(cred_path).exists())
    print(f"Credentials file on disk   : {'FOUND' if file_exists else 'NOT FOUND'}")

    if not file_exists:
        print("\n[!] WARNING: Firebase credentials file was not found.")
        print(f"    Expected path: {cred_path}")
        print("    To fix this:")
        print("    1. Go to Firebase Console -> Project Settings -> Service accounts.")
        print("    2. Click 'Generate new private key'.")
        print("    3. Save the JSON file as 'firebase-service-account.json' in the project root or backend/ folder.")
        print("    4. Set FIREBASE_PROJECT_ID in backend/.env to your Firebase Project ID.")
        print("    5. Refer to docs/FIREBASE_SETUP.md for full step-by-step guidance.")
        return False

    print("\nAttempting Firebase Admin SDK initialization...")
    success, err = init_firebase()

    if not success:
        print(f"[ERROR] Firebase initialization failed:\n  {err}")
        return False

    print("[OK] Firebase Admin SDK initialized successfully.")

    print("Testing Cloud Firestore connection...")
    try:
        db = get_firestore_client()
        # Test a read from a meta collection
        test_doc = db.collection('_health_check').document('ping').get()
        print("[OK] Cloud Firestore connection verified successfully.")
        return True
    except Exception as e:
        print(f"[ERROR] Cloud Firestore test read failed:\n  {str(e)}")
        return False


if __name__ == '__main__':
    ok = run_check()
    sys.exit(0 if ok else 1)

