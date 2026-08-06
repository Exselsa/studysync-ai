"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { Bell, BrainCircuit, LogIn, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useState } from "react";

const navLinks = [
  { label: "Dashboard",  href: "/dashboard" },
  { label: "Study Plan", href: "/dashboard/plan" },
  { label: "AI Tutor",   href: "/dashboard/tutor" },
];

/**
 * NavigationBar
 *
 * Fixed top navigation bar with glassmorphism styling.
 * - Left: BrainCircuit icon + StudySync AI wordmark
 * - Center: Primary navigation links with Framer Motion layoutId underline
 * - Right: Auth action area (sign-in or user avatar + notifications)
 */
export default function NavigationBar() {
  const pathname = usePathname();
  const { user, loading, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  async function handleSignIn() {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // After sign-in, AuthProvider updates the user state automatically.
      // Navigation to /dashboard is the user's choice via the CTA.
    } catch {
      // User closed the popup or sign-in was cancelled — no-op.
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 h-16"
      role="banner"
    >
      {/* Glass panel background */}
      <div className="absolute inset-0 glass-panel border-t-0 border-l-0 border-r-0 border-b" />

      {/* Bottom border line */}
      <div className="absolute bottom-0 inset-x-0 h-px divider-glass" />

      <nav
        className="relative h-full max-w-7xl mx-auto px-6 flex items-center justify-between"
        aria-label="Primary navigation"
      >
        {/* ---- Left: Wordmark ---- */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group flex-shrink-0"
          aria-label="StudySync AI — home"
        >
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.08) 100%)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              boxShadow: "var(--shadow-glow-sm)",
            }}
          >
            <BrainCircuit
              size={16}
              style={{ color: "var(--color-gold-400)" }}
              aria-hidden="true"
            />
          </span>

          <span
            className="font-outfit text-[15px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            <span style={{ color: "var(--color-silver-50)" }}>StudySync</span>
            <span
              className="text-gradient-gold ml-0.5"
              aria-hidden="true"
            >
              {" "}AI
            </span>
          </span>
        </Link>

        {/* ---- Center: Nav links ---- */}
        <ul
          className="hidden md:flex items-center gap-1"
          role="list"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "relative flex items-center h-8 px-3.5 rounded-lg text-[13px] font-medium tracking-wide transition-colors duration-150"
                  )}
                  style={{
                    color: isActive
                      ? "var(--color-silver-50)"
                      : "var(--color-silver-300)",
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <m.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: "rgba(255, 255, 255, 0.07)",
                        border: "1px solid rgba(255, 255, 255, 0.10)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ---- Right: Auth area ---- */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Loading skeleton while auth resolves */}
          {loading && (
            <div
              className="w-24 h-8 rounded-lg animate-pulse"
              style={{ background: "rgba(255,255,255,0.06)" }}
              aria-label="Loading authentication state"
            />
          )}

          {/* Authenticated state */}
          {!loading && user && (
            <>
              <button
                type="button"
                id="nav-notifications"
                className="icon-btn"
                aria-label="Notifications"
              >
                <Bell size={15} aria-hidden="true" />
              </button>

              <Link
                href="/dashboard"
                id="nav-user-avatar"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.15)",
                }}
                aria-label="Go to dashboard"
              >
                {user.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? "User avatar"}
                    width={22}
                    height={22}
                    className="rounded-full"
                  />
                ) : (
                  <div
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(245,158,11,0.2)",
                    }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: "var(--color-gold-300)" }}
                    >
                      {(user.displayName ?? user.email ?? "S").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span
                  className="hidden sm:block text-[12px] font-medium"
                  style={{ color: "var(--color-silver-100)" }}
                >
                  {user.displayName?.split(" ")[0] ?? "Scholar"}
                </span>
              </Link>
            </>
          )}

          {/* Unauthenticated state */}
          {!loading && !user && (
            <m.button
              type="button"
              id="nav-sign-in"
              onClick={handleSignIn}
              disabled={signingIn}
              className="btn-primary text-[13px] px-5 py-2 gap-2"
              aria-label="Masuk dengan Google"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97, y: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              {signingIn ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <LogIn size={13} aria-hidden="true" />
              )}
              {signingIn ? "Proses Masuk..." : "Masuk"}
            </m.button>
          )}
        </div>
      </nav>
    </header>
  );
}
