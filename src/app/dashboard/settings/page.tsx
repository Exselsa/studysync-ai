"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  User,
  Bell,
  Palette,
  ShieldAlert,
  Save,
  Trash2,
  Moon,
  Sun,
  BrainCircuit,
  AlertTriangle,
  Check,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/lib/contexts/AuthContext";

/* ------------------------------------------------------------------
   Animation config
------------------------------------------------------------------ */
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const sectionVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: EASE } },
};

/* ------------------------------------------------------------------
   Sub-components
------------------------------------------------------------------ */

/** Glassmorphic section card */
function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  accentColor = "rgba(245,158,11,0.8)",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <m.section
      variants={sectionVariants}
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      style={{
        background: "rgba(6,16,46,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        overflow: "hidden",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: accentColor.replace("0.8", "0.12"),
            border: `1px solid ${accentColor.replace("0.8", "0.22")}`,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <Icon size={15} style={{ color: accentColor }} />
        </div>
        <div>
          <h2
            id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "var(--color-silver-50)",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--color-silver-400)", marginTop: "0.1rem" }}>
            {description}
          </p>
        </div>
      </div>

      {/* Section body */}
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </m.section>
  );
}

/** Labelled input field */
function SettingsField({
  id,
  label,
  type = "text",
  value,
  onChange,
  disabled = false,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--color-silver-300)",
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "10px",
          padding: "0.625rem 0.875rem",
          fontSize: "0.875rem",
          color: disabled ? "var(--color-silver-400)" : "var(--color-silver-100)",
          outline: "none",
          width: "100%",
          transition: "border-color 150ms ease",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => { if (!disabled) (e.target as HTMLInputElement).style.borderColor = "rgba(245,158,11,0.4)"; }}
        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.10)"; }}
      />
    </div>
  );
}

/** Toggle switch */
function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.875rem 1rem",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div>
        <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-silver-100)", lineHeight: 1.4 }}>
          {label}
        </p>
        <p style={{ fontSize: "0.6875rem", color: "var(--color-silver-400)", marginTop: "0.15rem" }}>
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        style={{
          width: "2.75rem",
          height: "1.5rem",
          borderRadius: "9999px",
          border: "none",
          cursor: "pointer",
          background: checked
            ? "rgba(245,158,11,0.8)"
            : "rgba(255,255,255,0.10)",
          transition: "background 200ms ease",
          position: "relative",
          flexShrink: 0,
          boxShadow: checked ? "0 0 10px rgba(245,158,11,0.35)" : "none",
        }}
      >
        <m.span
          animate={{ x: checked ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            display: "block",
            width: "1.125rem",
            height: "1.125rem",
            borderRadius: "50%",
            background: "white",
            position: "absolute",
            top: "3px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}

import { useTheme } from "next-themes";

/* ------------------------------------------------------------------
   Settings Content
------------------------------------------------------------------ */
function SettingsContent() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saved, setSaved] = useState(false);

  // Preference toggles
  const isDark = theme === "dark" || theme === undefined;
  const [emailNotifs, setEmailNotifs]     = useState(true);
  const [planReminders, setPlanReminders] = useState(true);
  const [aiInsights, setAiInsights]       = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  function handleSaveProfile() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem 2rem 3rem",
        gap: "1.5rem",
        maxWidth: "760px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* Page title */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: EASE }}
      >
        <h1
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 700,
            fontSize: "1.5rem",
            color: "var(--color-silver-50)",
            lineHeight: 1.2,
            marginBottom: "0.25rem",
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-silver-400)" }}>
          Manage your account, preferences, and notifications.
        </p>
      </m.div>

      {/* ── 1. Profile Settings ── */}
      <m.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        <SettingsSection
          icon={User}
          title="Profile Settings"
          description="Your public identity within StudySync AI."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "Your avatar"}
                  width={56}
                  height={56}
                  style={{
                    borderRadius: "50%",
                    border: "2px solid rgba(245,158,11,0.3)",
                    boxShadow: "0 0 16px rgba(245,158,11,0.15)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.1) 100%)",
                    border: "2px solid rgba(245,158,11,0.3)",
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <BrainCircuit size={22} style={{ color: "var(--color-gold-400)" }} />
                </div>
              )}
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-silver-100)" }}>
                  {user?.displayName ?? "Scholar"}
                </p>
                <p style={{ fontSize: "0.6875rem", color: "var(--color-silver-400)", marginTop: "0.1rem" }}>
                  Signed in with Google · Avatar managed by your Google account
                </p>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <SettingsField
                id="settings-display-name"
                label="Display Name"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Your name"
              />
              <SettingsField
                id="settings-email"
                label="Email Address"
                type="email"
                value={user?.email ?? ""}
                onChange={() => {}}
                disabled
                placeholder="your@email.com"
              />
            </div>

            {/* Save button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <m.button
                type="button"
                id="settings-save-profile"
                onClick={handleSaveProfile}
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  background: saved
                    ? "rgba(34,197,94,0.15)"
                    : "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.12) 100%)",
                  color: saved ? "rgba(34,197,94,0.9)" : "var(--color-gold-300)",
                  boxShadow: saved
                    ? "0 0 0 1px rgba(34,197,94,0.25)"
                    : "0 0 0 1px rgba(245,158,11,0.2)",
                  transition: "background 250ms ease, color 250ms ease",
                }}
                aria-label="Save profile changes"
              >
                <AnimatePresence mode="wait">
                  {saved ? (
                    <m.span
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      <Check size={13} aria-hidden="true" /> Saved!
                    </m.span>
                  ) : (
                    <m.span
                      key="save"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      <Save size={13} aria-hidden="true" /> Save Changes
                    </m.span>
                  )}
                </AnimatePresence>
              </m.button>
            </div>
          </div>
        </SettingsSection>

        {/* ── 2. Preferences ── */}
        <SettingsSection
          icon={Palette}
          title="Preferences"
          description="Customise your StudySync AI experience."
          accentColor="rgba(56,189,248,0.8)"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <ToggleSwitch
              id="pref-dark-mode"
              label="Dark Mode"
              description="Use the dark theme across the entire app."
              checked={isDark}
              onToggle={() => setTheme(isDark ? "light" : "dark")}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: "rgba(56,189,248,0.06)",
                border: "1px solid rgba(56,189,248,0.12)",
              }}
            >
              {isDark ? (
                <Moon size={12} style={{ color: "rgba(56,189,248,0.7)", flexShrink: 0 }} aria-hidden="true" />
              ) : (
                <Sun size={12} style={{ color: "rgba(245,158,11,0.7)", flexShrink: 0 }} aria-hidden="true" />
              )}
              <p style={{ fontSize: "0.6875rem", color: "var(--color-silver-400)" }}>
                {isDark
                  ? "Dark mode is active — optimised for late-night study sessions."
                  : "Light mode is active — bright and focused for daytime studying."}
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* ── 3. Notifications ── */}
        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Choose how and when StudySync AI contacts you."
          accentColor="rgba(168,85,247,0.8)"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <ToggleSwitch
              id="pref-email-notifs"
              label="Email Notifications"
              description="Receive weekly study summaries and tips via email."
              checked={emailNotifs}
              onToggle={() => setEmailNotifs((v) => !v)}
            />
            <ToggleSwitch
              id="pref-plan-reminders"
              label="Study Plan Reminders"
              description="Get reminded when a task due date is approaching."
              checked={planReminders}
              onToggle={() => setPlanReminders((v) => !v)}
            />
            <ToggleSwitch
              id="pref-ai-insights"
              label="AI Weekly Insights"
              description="Let the AI Tutor send personalised study suggestions."
              checked={aiInsights}
              onToggle={() => setAiInsights((v) => !v)}
            />
          </div>
        </SettingsSection>

        {/* ── 4. Danger Zone ── */}
        <SettingsSection
          icon={ShieldAlert}
          title="Danger Zone"
          description="Permanent actions that cannot be undone."
          accentColor="rgba(239,68,68,0.8)"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                padding: "1rem",
                borderRadius: "12px",
                background: "rgba(239,68,68,0.05)",
                border: "1px solid rgba(239,68,68,0.14)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <AlertTriangle size={15} style={{ color: "rgba(239,68,68,0.7)", marginTop: "2px", flexShrink: 0 }} aria-hidden="true" />
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(239,68,68,0.85)", lineHeight: 1.4 }}>
                  Delete Account
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-silver-400)", marginTop: "0.2rem", lineHeight: 1.5 }}>
                  Permanently deletes your account, all study plans, and progress data.
                  This action is <strong style={{ color: "rgba(239,68,68,0.7)" }}>irreversible</strong>.
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!deleteConfirm ? (
                <m.button
                  key="delete-btn"
                  type="button"
                  id="settings-delete-account"
                  onClick={() => setDeleteConfirm(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(239,68,68,0.25)",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    background: "rgba(239,68,68,0.08)",
                    color: "rgba(239,68,68,0.85)",
                    alignSelf: "flex-start",
                  }}
                  aria-label="Begin account deletion"
                >
                  <Trash2 size={13} aria-hidden="true" />
                  Delete My Account
                </m.button>
              ) : (
                <m.div
                  key="delete-confirm"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "12px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(239,68,68,0.9)" }}>
                    Are you absolutely sure?
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-silver-400)" }}>
                    Type <strong style={{ color: "var(--color-silver-200)" }}>DELETE</strong> in the field below to confirm.
                  </p>
                  <input
                    id="settings-delete-confirm-input"
                    type="text"
                    placeholder="Type DELETE to confirm"
                    aria-label="Confirm account deletion"
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "8px",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.8125rem",
                      color: "var(--color-silver-100)",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      id="settings-delete-confirm-cancel"
                      onClick={() => setDeleteConfirm(false)}
                      style={{
                        padding: "0.4rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "var(--color-silver-300)",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="settings-delete-confirm-submit"
                      style={{
                        padding: "0.4rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(239,68,68,0.3)",
                        background: "rgba(239,68,68,0.15)",
                        color: "rgba(239,68,68,0.9)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Permanently Delete
                    </button>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </SettingsSection>
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Page export — wrapped in ProtectedRoute
------------------------------------------------------------------ */
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
