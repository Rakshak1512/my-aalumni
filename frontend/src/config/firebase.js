/**
 * Firebase Client Configuration & Authentication
 * Uses public Firebase Web Client credentials for client-side Auth.
 * Never stores backend secrets or service account keys in the frontend!
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Public Web Firebase Configuration
// Can be customized via window.__FIREBASE_CONFIG__ or standard defaults for local demo testing
export const defaultFirebaseWebConfig = {
  apiKey: "AIzaSyDemoPlaceholderForWebAuth2026",
  authDomain: "myalumni-portal-demo.firebaseapp.com",
  projectId: "myalumni-portal-demo",
  storageBucket: "myalumni-portal-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

const firebaseConfig = (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__)
  ? window.__FIREBASE_CONFIG__
  : defaultFirebaseWebConfig;

let app;
let auth;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.warn("Firebase client initialization warning:", err.message);
}

export { auth };

/**
 * Sign in user with Email and Password via Firebase Auth
 */
export async function firebaseSignIn(email, password) {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
}

/**
 * Register user with Email and Password via Firebase Auth
 */
export async function firebaseSignUp(email, password) {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Send email verification
  try {
    await sendEmailVerification(userCredential.user);
  } catch (e) {
    console.warn("Could not send verification email:", e.message);
  }
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
}

/**
 * Send Password Reset Email via Firebase Auth supported workflow
 */
export async function firebaseSendPasswordReset(email) {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  return await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out from Firebase Auth
 */
export async function firebaseSignOut() {
  if (!auth) return;
  return await signOut(auth);
}

/**
 * Get refreshed Firebase ID token for authenticated user
 */
export async function getFreshIdToken() {
  if (!auth || !auth.currentUser) return null;
  return await auth.currentUser.getIdToken(true);
}

