# MyAlumni 2.0 — Firebase & Cloud Firestore Setup Guide

MyAlumni 2.0 uses **Firebase Authentication** for user identity and **Cloud Firestore** as its primary persistent database platform.

Follow this step-by-step setup guide to connect your Firebase project.

---

## Step 1: Create a Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter a project name (e.g., `myalumni-portal-production`).
4. (Optional) Disable Google Analytics for local development.
5. Click **Create project** and wait for provisioning to complete.

---

## Step 2: Enable Firebase Authentication

1. In the left navigation bar, open **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable the **Email/Password** toggle (leave "Email link" disabled unless desired).
5. Click **Save**.

### Email Verification & Password Reset
Firebase Authentication manages email verification links and password reset requests. Under **Templates**, you can customize the email sender name and format.

---

## Step 3: Create Cloud Firestore Database

1. In the left navigation, open **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a database location closest to your users (e.g., `nam5 (us-central)` or `asia-south1`).
4. Select **Start in production mode** (our security rules in `firebase/firestore.rules` will govern access).
5. Click **Create**.

---

## Step 4: Download Service Account Credentials

To allow the Flask backend to authenticate requests via Firebase Admin SDK:

1. In the Firebase Console, click the gear icon (⚙️) next to *Project Overview* and select **Project settings**.
2. Navigate to the **Service accounts** tab.
3. Select **Python** and click **Generate new private key**.
4. Confirm by clicking **Generate key**.
5. A JSON file will download to your computer.
6. Rename this file to `firebase-service-account.json`.
7. Move it into the project root or `backend/` directory:
   ```text
   e:\updated alumni\backend\firebase-service-account.json
   ```

> [!WARNING]
> Keep `firebase-service-account.json` strictly private! It is already listed in `.gitignore` to prevent accidental commits to public repositories.

---

## Step 5: Configure Backend Environment

Open `backend/.env` and update the Firebase fields:

```env
FIREBASE_PROJECT_ID=your-actual-firebase-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```

---

## Step 6: Deploy Firestore Security Rules and Indexes

Install Firebase CLI if you wish to deploy rules directly:

```bash
npm install -g firebase-tools
firebase login
firebase use your-actual-firebase-project-id
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Alternatively, copy the contents of `firebase/firestore.rules` directly into the **Rules** tab of your Firestore Database console and click **Publish**.

---

## Step 7: Verify Configuration with Provided Script

Run the verification tool to test connectivity:

```powershell
# From project root
python scripts/check_firebase.py
```

Expected output:
```text
==================================================
  MyAlumni 2.0 — Firebase Configuration Check
==================================================
Project ID configured      : your-firebase-project-id
Credentials path           : ./firebase-service-account.json
Credentials file on disk   : FOUND

Attempting Firebase Admin SDK initialization...
[OK] Firebase Admin SDK initialized successfully.
Testing Cloud Firestore connection...
[OK] Cloud Firestore connection verified successfully.
```

---

## Step 8: Provision the 4 Test Users and Demo Data

Once Firebase connectivity is verified:

```powershell
python scripts/seed_demo_users.py
python scripts/seed_demo_data.py
```

All 4 test accounts (`admin.demo@myalumni.test`, `faculty.demo@myalumni.test`, `student.demo@myalumni.test`, `alumni.demo@myalumni.test`) will be created in Firebase Authentication with `email_verified=True` and synced to Cloud Firestore.

