/**
 * Firebase Web SDK configuration and client authentication.
 * Public web config is supplied through Vite environment variables; never use placeholder API keys.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth, signInWithCustomToken, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail,
  sendEmailVerification, signOut
} from 'firebase/auth';

export const defaultFirebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

const injectedConfig = typeof window !== 'undefined' ? window.__FIREBASE_CONFIG__ : null;
const firebaseConfig = injectedConfig || defaultFirebaseWebConfig;
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingFields = requiredFields.filter((key) => !firebaseConfig[key] || String(firebaseConfig[key]).includes('Placeholder'));
let auth = null;

if (!missingFields.length) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.error('Firebase client initialization failed:', error);
  }
}

export { auth };

function assertConfigured() {
  if (missingFields.length) {
    throw new Error('Firebase web configuration is missing or invalid. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in frontend/.env using values from Firebase Console.');
  }
  if (!auth) throw new Error('Firebase Authentication could not initialize. Check the Firebase web configuration.');
}

export async function firebaseSignIn(email, password) {
  assertConfigured();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return { user: credential.user, token: await credential.user.getIdToken() };
}
export async function firebaseSignUp(email, password) {
  assertConfigured();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try { await sendEmailVerification(credential.user); } catch (error) { console.warn('Email verification dispatch failed:', error.message); }
  return { user: credential.user, token: await credential.user.getIdToken() };
}
export async function firebaseSignInWithCustomToken(customToken) {
  assertConfigured();
  const credential = await signInWithCustomToken(auth, customToken);
  return { user: credential.user, token: await credential.user.getIdToken(true) };
}
export async function firebaseSendPasswordReset(email) {
  assertConfigured();
  return sendPasswordResetEmail(auth, email);
}
export async function firebaseSignOut() {
  if (auth) return signOut(auth);
}
export async function getFreshIdToken() {
  if (!auth || !auth.currentUser) return null;
  return auth.currentUser.getIdToken(true);
}
