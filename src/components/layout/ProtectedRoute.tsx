"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

/* ---------------------------------------------------------------
   Spinner animation variants
--------------------------------------------------------------- */
const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1.1,
      ease: "linear" as const,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/* ---------------------------------------------------------------
   Loading Spinner UI
--------------------------------------------------------------- */
function AuthLoadingScreen() {
  return (
    <m.div
      key="auth-loading"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      aria-label="Verifying authentication"
      role="status"
    >
      {/* Frosted glass card */}
      <div
        className="glass-panel flex flex-col items-center gap-6 px-12 py-10 rounded-2xl"
        style={{ minWidth: "240px" }}
      >
        {/* Animated ring spinner */}
        <div className="relative w-12 h-12" aria-hidden="true">
          {/* Static track */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid rgba(255, 255, 255, 0.07)",
            }}
          />
          {/* Spinning arc */}
          <m.div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid transparent",
              borderTopColor: "var(--color-gold-400)",
              borderRightColor: "rgba(245, 158, 11, 0.3)",
            }}
            variants={spinnerVariants}
            animate="animate"
          />
        </div>

        {/* Label */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p
            className="text-[13px] font-semibold tracking-wide"
            style={{
              fontFamily: "var(--font-outfit)",
              color: "var(--color-silver-100)",
            }}
          >
            Verifying Session
          </p>
          <p
            className="text-[11px] tracking-wider uppercase"
            style={{ color: "var(--color-silver-400)" }}
          >
            StudySync AI
          </p>
        </div>
      </div>
    </m.div>
  );
}

/* ---------------------------------------------------------------
   ProtectedRoute
--------------------------------------------------------------- */
/**
 * Wraps any page that requires authentication.
 *
 * Redirect logic:
 * - While Firebase resolves the persisted session (`loading === true`): renders
 *   the `AuthLoadingScreen`. We do NOT redirect here — the user may be
 *   authenticated but Firebase hasn't confirmed it yet.
 * - Once `loading` settles to `false`, if `user` is still null: the `useEffect`
 *   fires and calls `router.replace("/")`.
 *
 * Guard against false redirects:
 * - `didMountRef` ensures we never redirect on the very first synchronous
 *   render pass (React 18 Strict Mode double-invokes effects; the guard
 *   prevents a stale effect from a prior unmount cycle from firing redirect).
 * - `router` is intentionally omitted from the dependency array: Next.js's
 *   `useRouter()` returns a stable singleton — it never changes identity —
 *   so including it is unnecessary and can cause spurious re-runs when the
 *   App Router updates its internal state during navigation.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  /*
   * Tracks whether the component has completed its first committed render.
   * We skip any redirect logic until after the initial mount effect has run,
   * preventing a race where React renders the component before the auth
   * context has propagated its current (non-null) user value.
   */
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Mark the component as fully mounted after the first commit.
    isMountedRef.current = true;

    // Cleanup: mark as unmounted so any lingering async callbacks don't
    // attempt a redirect after this instance has been torn down.
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    /*
     * Safety gate 1: Do not redirect while the auth state is still resolving.
     * Firebase reads the persisted session from IndexedDB asynchronously;
     * `loading` stays true until the first onAuthStateChanged callback fires.
     */
    if (loading) return;

    /*
     * Safety gate 2: Do not redirect before the component has completed its
     * first mount. This prevents a Strict Mode double-invoke scenario where
     * the effect from a prior unmount cycle runs against the fresh mount's
     * state snapshot.
     */
    if (!isMountedRef.current) return;

    /*
     * Only redirect when we are certain: auth is resolved AND there is no user.
     */
    if (!user) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);
  // ^ `router` is deliberately excluded: it is a stable Next.js singleton.
  //   Including it causes the effect to re-run whenever the App Router updates
  //   its internal navigation state, which can trigger a redirect mid-navigation
  //   before the page component has finished committing.

  // Phase 1: Auth state is still loading — show the spinner.
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Phase 2: Auth resolved but no user — we are about to redirect.
  // Render nothing to prevent any flash of protected content.
  if (!user) {
    return null;
  }

  // Phase 3: Authenticated — render the protected page content.
  return <>{children}</>;
}
