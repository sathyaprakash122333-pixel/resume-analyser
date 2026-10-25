import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

// Read Firebase Web Configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "resume-analyser-e4441.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "resume-analyser-e4441",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "resume-analyser-e4441.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "538386306246",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:538386306246:web:add41bb1561bd4c81bb3c7"
};

// Initialize Firebase only once
let app = null;
let auth = null;
let googleProvider = null;
let firebaseInitialized = false;
let initError = null;

try {
  // Validate that essential credentials exist before calling initializeApp
  if (!firebaseConfig.apiKey) {
    console.warn(
      "[Firebase] VITE_FIREBASE_API_KEY is not configured in .env.local. " +
      "Google Sign-In will prompt to configure it before attempting authentication."
    );
  }
  
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  firebaseInitialized = true;
} catch (error) {
  console.error("[Firebase] Initialization error:", error);
  initError = error;
}

/**
 * Initiates Google Sign-In using Firebase Authentication popup.
 * Handles user cancellations, network issues, and missing config gracefully.
 */
export async function signInWithGoogle() {
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "Firebase API key is missing. Please add VITE_FIREBASE_API_KEY to frontend/.env.local and enable Google Sign-In in Firebase Console."
    );
  }

  if (!auth || !googleProvider) {
    throw new Error("Firebase Authentication is not initialized properly: " + (initError?.message || "Unknown error"));
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    // Graceful handling for known Firebase Auth errors
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled: The login window was closed before finishing.");
    }
    if (error.code === "auth/cancelled-popup-request") {
      throw new Error("Another sign-in request is already in progress.");
    }
    if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up blocked: Please allow pop-ups for this site to sign in with Google.");
    }
    if (error.code === "auth/network-request-failed") {
      throw new Error("Network error during sign-in. Please check your internet connection.");
    }
    if (error.code === "auth/operation-not-allowed") {
      throw new Error("Google sign-in is not enabled in Firebase Console. Please enable the Google provider.");
    }
    if (error.code === "auth/unauthorized-domain") {
      throw new Error(`Domain not authorized: Please add '${window.location.hostname}' to Authorized Domains in Firebase Console > Authentication > Settings.`);
    }
    throw error;
  }
}

/**
 * Signs the user out of Firebase Authentication.
 */
export async function logOut() {
  if (!auth) return;
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("[Firebase] Sign out error:", error);
    throw error;
  }
}

/**
 * Subscribes to Firebase Authentication state changes.
 * Calls callback(user) whenever authentication state changes.
 * Returns unsubscribe function.
 */
export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Updates the current user's profile in Firebase Authentication.
 */
export async function updateUserProfile({ displayName, photoURL }) {
  if (!auth || !auth.currentUser) {
    throw new Error("No authenticated user found.");
  }
  const updates = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (photoURL !== undefined) updates.photoURL = photoURL;

  await updateProfile(auth.currentUser, updates);
  return auth.currentUser;
}

export { auth, firebaseInitialized };
