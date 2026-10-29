# Email OTP Authentication

MyAlumni uses a six-digit email OTP for login, registration, and password reset. OTP delivery requires valid backend SMTP settings and valid Firebase Admin credentials. OTPs expire after 10 minutes, are stored as hashes, are single-use, and allow at most five incorrect attempts.

## Required configuration

### Frontend `frontend/.env`

Copy `.env.example` to `.env` and set the public Firebase Web App configuration from Firebase Console > Project settings > Your apps. The Firebase web API key is public client configuration, not a service-account secret, but it must be the actual key for the intended project.

```env
VITE_APP_NAME=MyAlumni
VITE_API_BASE_URL=http://127.0.0.1:5000/api/v1
VITE_FIREBASE_API_KEY=actual_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Restart Vite after changing environment variables.

### Backend `backend/.env`

Set a valid Firebase Admin service-account credential securely, plus SMTP host, port, username, password/app password, and sender address. Do not commit secrets.

## Firebase setup

1. Enable Firebase Authentication > Email/Password.
2. Ensure the Admin SDK service account belongs to the same Firebase project as the frontend web config.
3. Enable Firestore.
4. Configure the Firebase project's authorized domains for the app origin.
5. Provision demo accounts through the controlled seed script; demo email domains ending in `.test` do not have real inboxes, so OTP testing requires a real test mailbox or an explicitly provisioned local test strategy.
6. Do not expose OTPs in API responses, logs, or browser storage.

## OTP API

- `POST /api/v1/auth/otp/request` with `{ "email": "...", "purpose": "login|register|reset" }`
- `POST /api/v1/auth/otp/verify` with `{ "email": "...", "purpose": "...", "code": "123456" }` plus registration or reset fields as appropriate.

A successful verification returns a Firebase custom token. The frontend exchanges it for a Firebase session and then fetches the server-side profile/role.

## Important limitations

This implementation requires working SMTP and Firebase credentials. If either is misconfigured, authentication must fail visibly; do not bypass verification or use hardcoded demo tokens. Password-reset email links are not used by this OTP flow.
