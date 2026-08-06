import type { Metadata } from "next";
import DashboardSidebarClient from "@/components/layout/DashboardSidebar";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s · StudySync AI",
  },
  description:
    "Your adaptive study dashboard — track progress, review your AI-generated study plan, and launch AI Tutor sessions.",
};

/**
 * Dashboard segment layout.
 *
 * Renders the persistent glassmorphic sidebar alongside a scrollable main
 * content area. The sidebar is a Client Component (DashboardSidebarClient)
 * because it uses usePathname() and useAuth() hooks.
 *
 * This layout wraps all routes under /dashboard/*, so it persists across
 * navigations within the dashboard segment without re-mounting.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-0 relative">
      <DashboardSidebarClient>{children}</DashboardSidebarClient>
    </div>
  );
}
