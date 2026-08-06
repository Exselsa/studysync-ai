import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Firebase client configuration sourced entirely from environment variables.
 * Values are populated at build time by Next.js from .env.local.
 *
 * To configure: open .env.local and paste your Firebase project values.
 * Find them at: Firebase Console > Project Settings > Your apps > SDK setup and configuration
 */
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase app.
 * Guards against duplicate initialization during Next.js Hot Module Replacement.
 */
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Firebase Authentication instance.
 * Import this in any component or server action that needs auth.
 */
const auth: Auth = getAuth(app);

/**
 * Firestore database instance.
 * Import this wherever you need to read/write Firestore documents.
 */
const db: Firestore = getFirestore(app);

export { app, auth, db };
