"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  BrainCircuit,
  Settings,
  LogOut,
  ChevronRight,
  Swords,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { cn } from "@/lib/cn";
import FriendsPanel from "@/components/friends/FriendsPanel";
import ChallengeNotificationToast from "@/components/friends/ChallengeNotificationToast";

/* ---------------------------------------------------------------
   Sidebar Navigation Items
--------------------------------------------------------------- */
const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    Icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Study Plan",
    href: "/dashboard/plan",
    Icon: CalendarDays,
    exact: false,
  },
  {
    label: "AI Tutor",
    href: "/dashboard/tutor",
    Icon: BrainCircuit,
    exact: false,
  },
  {
    label: "Boss Fight",
    href: "/dashboard/game",
    Icon: Swords,
    exact: false,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    Icon: Settings,
    exact: false,
  },
] as const;

/* ---------------------------------------------------------------
   Sidebar Component
--------------------------------------------------------------- */
function DashboardSidebar() {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();

  function computeActive(href: string, exact: boolean): boolean {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 z-40 flex flex-col"
      style={{ width: "220px" }}
      aria-label="Dashboard navigation"
    >
      {/* Glass panel background */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(3, 11, 34, 0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.07)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative flex flex-col flex-1 px-3 py-5 gap-1 overflow-y-auto">
        {/* Section label */}
        <p
          className="px-3 mb-3 text-[10px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "var(--color-silver-400)" }}
        >
          Navigation
        </p>

        <nav role="list" aria-label="Dashboard sections">
          {navItems.map(({ label, href, Icon, exact }) => {
            const active = computeActive(href, exact);
            return (
              <li key={href} role="listitem" className="list-none">
                <Link
                  href={href}
                  id={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                    active
                      ? "text-silver-50"
                      : "text-silver-400 hover:text-silver-100"
                  )}
                  style={{
                    color: active
                      ? "var(--color-silver-50)"
                      : "var(--color-silver-400)",
                  }}
                >
                  {/* Active background with skeuomorphic pressed shadow */}
                  {active && (
                    <m.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.05) 100%)",
                        border: "1px solid rgba(245, 158, 11, 0.18)",
                        boxShadow: "var(--shadow-skeuo-pressed)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Hover background (non-active) */}
                  {!active && (
                    <span
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Icon */}
                  <Icon
                    size={15}
                    strokeWidth={active ? 2 : 1.75}
                    className="relative z-10 flex-shrink-0"
                    style={{
                      color: active
                        ? "var(--color-gold-400)"
                        : "var(--color-silver-400)",
                      transition: "color 150ms",
                    }}
                    aria-hidden="true"
                  />

                  {/* Label */}
                  <span className="relative z-10">{label}</span>

                  {/* Active chevron */}
                  {active && (
                    <ChevronRight
                      size={12}
                      className="relative z-10 ml-auto"
                      style={{ color: "var(--color-gold-400)" }}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Friends Panel Widget */}
        <div className="px-1 py-2">
          <FriendsPanel />
        </div>

        {/* Divider */}
        <div className="divider-glass my-3" aria-hidden="true" />

        {/* User identity & sign-out */}
        {user && (
          <div className="flex flex-col gap-2 px-1">
            {/* User info */}
            <div className="flex items-center gap-3 px-2 py-2">
              {/* Avatar */}
              {user.photoURL ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "User avatar"}
                  width={30}
                  height={30}
                  className="rounded-full flex-shrink-0"
                  style={{
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    boxShadow: "var(--shadow-glow-sm)",
                  }}
                />
              ) : (
                <div
                  className="w-[30px] h-[30px] rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.1) 100%)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                  aria-hidden="true"
                >
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: "var(--color-gold-300)" }}
                  >
                    {(user.displayName ?? user.email ?? "S").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Name & email */}
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[12px] font-semibold truncate"
                  style={{
                    fontFamily: "var(--font-outfit)",
                    color: "var(--color-silver-100)",
                  }}
                >
                  {user.displayName ?? "Scholar"}
                </span>
                <span
                  className="text-[10px] truncate"
                  style={{ color: "var(--color-silver-400)" }}
                >
                  {user.email}
                </span>
              </div>
            </div>

            {/* Sign Out */}
            <button
              type="button"
              id="sidebar-sign-out"
              onClick={signOutUser}
              className="relative flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-150 group"
              style={{ color: "var(--color-silver-400)" }}
              aria-label="Sign out of StudySync AI"
            >
              <span
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                  background: "rgba(239, 68, 68, 0.06)",
                  border: "1px solid rgba(239, 68, 68, 0.12)",
                }}
                aria-hidden="true"
              />
              <LogOut
                size={13}
                strokeWidth={1.75}
                className="relative z-10 flex-shrink-0 group-hover:text-red-400 transition-colors duration-150"
                aria-hidden="true"
              />
              <span className="relative z-10 group-hover:text-red-400 transition-colors duration-150">
                Sign Out
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------
   Dashboard Layout Export
--------------------------------------------------------------- */
export default function DashboardSidebarClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardSidebar />
      <ChallengeNotificationToast />
      {/* Main content area — offset by sidebar width */}
      <div
        className="flex flex-col flex-1 min-h-0"
        style={{ marginLeft: "220px" }}
      >
        {children}
      </div>
    </>
  );
}
