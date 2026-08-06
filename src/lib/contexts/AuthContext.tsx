"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";
import { saveUserProfile } from "@/lib/firebase/friends";

/* ---------------------------------------------------------------
   Types
--------------------------------------------------------------- */
interface AuthContextValue {
  /** The currently authenticated Firebase user, or null if signed out. */
  user: User | null;
  /**
   * True while the initial auth state is being resolved from Firebase.
   * Components should render a loading UI rather than redirect prematurely.
   */
  loading: boolean;
  /**
   * Opens the Google OAuth popup and signs the user in.
   * Returns the signed-in User on success.
   * Throws a FirebaseError on failure (e.g., popup closed by user).
   */
  signInWithGoogle: () => Promise<User>;
  /**
   * Signs the current user out and clears the auth state.
   */
  signOutUser: () => Promise<void>;
}

/* ---------------------------------------------------------------
   Context
--------------------------------------------------------------- */
const AuthContext = createContext<AuthContextValue | null>(null);

/* ---------------------------------------------------------------
   Provider
--------------------------------------------------------------- */
const googleProvider = new GoogleAuthProvider();
// Request access to the user's email and profile.
googleProvider.addScope("email");
googleProvider.addScope("profile");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Subscribe to Firebase Auth state changes. Firebase resolves the
     * persisted session from local storage before calling this the first time,
     * so `loading` remains true until the first callback fires.
     */
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await saveUserProfile(firebaseUser);
        } catch (err) {
          console.warn("Failed to sync user profile to Firestore:", err);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup the listener when the provider unmounts.
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      try {
        await saveUserProfile(result.user);
      } catch (err) {
        console.warn("Failed to sync user profile on sign in:", err);
      }
    }
    return result.user;
  }, []);

  const signOutUser = useCallback(async (): Promise<void> => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ---------------------------------------------------------------
   Hook
--------------------------------------------------------------- */
/**
 * Access the current authentication state and auth actions.
 *
 * Must be used inside an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error(
      "useAuth() must be called within an <AuthProvider>. " +
        "Ensure <AuthProvider> wraps your component tree in Providers.tsx."
    );
  }
  return ctx;
}
