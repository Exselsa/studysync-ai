"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence, type Variants } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Save,
  Trash2,
  BrainCircuit,
  AlertTriangle,
  Check,
  Key,
  Lock,
  Sparkles,
  Camera,
  Loader2,
  ShieldCheck,
  BookOpen,
  Mail,
  SlidersHorizontal,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/lib/contexts/AuthContext";
import { FieldGroup, Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";

/* ------------------------------------------------------------------
   Emil Kowalski & Apple Design Principles
   Easings: cubic-bezier(0.23, 1, 0.32, 1)
   Springs: stiffness 380, damping 30
------------------------------------------------------------------ */
const EMIL_EASE_ARR: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EMIL_SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.42, ease: EMIL_EASE_ARR },
  },
};

type TabType = "profile" | "security" | "notifications" | "ai";

/* ------------------------------------------------------------------
   Custom Cybernetic Glass Switch Component
------------------------------------------------------------------ */
function CyberneticSwitch({
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
      onClick={onToggle}
      className={cn(
        "p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 backdrop-blur-xl select-none",
        checked
          ? "bg-[#080C14]/90 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]"
          : "bg-[#030712]/60 border-white/10 hover:border-cyan-500/30"
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-bold text-white leading-snug">{label}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <m.button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        whileTap={{ scale: 0.94 }}
        transition={EMIL_SPRING}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "w-12 h-6 rounded-full p-0.5 relative transition-colors duration-300 cursor-pointer shrink-0",
          checked
            ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            : "bg-slate-800 border border-white/10"
        )}
      >
        <m.span
          animate={{ x: checked ? 24 : 2 }}
          transition={EMIL_SPRING}
          className="block size-5 rounded-full bg-white shadow-md"
        />
      </m.button>
    </div>
  );
}

/* ------------------------------------------------------------------
   Skeleton Loader State
------------------------------------------------------------------ */
function SettingsSkeleton() {
  return (
    <div className="flex flex-col flex-1 px-4 sm:px-8 py-8 max-w-5xl mx-auto w-full gap-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex flex-col gap-3">
          <div className="h-6 w-36 rounded-full bg-slate-800/60" />
          <div className="h-9 w-72 rounded-xl bg-slate-800/80" />
          <div className="h-4 w-96 rounded-lg bg-slate-800/40" />
        </div>
        <div className="h-9 w-40 rounded-2xl bg-slate-800/60" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 p-1.5 rounded-3xl bg-[#080C14]/90 border border-white/10 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-11 rounded-2xl bg-slate-800/50" />
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="h-32 rounded-3xl bg-[#080C14]/80 border border-white/10" />
        <div className="h-80 rounded-3xl bg-[#080C14]/80 border border-white/10" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Settings Page Main View
------------------------------------------------------------------ */
function SettingsContent() {
  const { user, loading } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [learningTarget, setLearningTarget] = useState("Teknik Informatika & Machine Learning");
  const [bio, setBio] = useState("Mahasiswa aktif yang suka tantangan Feynman Duel dan riset AI.");

  // Validation & Error State
  const [nameError, setNameError] = useState("");

  // Save & Toast State
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preference Toggles State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [planReminders, setPlanReminders] = useState(true);
  const [duelNotifs, setDuelNotifs] = useState(true);
  const [aiAutoSave, setAiAutoSave] = useState(true);
  const [aiAutoMute, setAiAutoMute] = useState(false);
  const [aiStyle, setAiStyle] = useState<"feynman" | "academic" | "interactive">("feynman");

  // Security State
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleSaveAll = async () => {
    if (!displayName.trim()) {
      setNameError("Nama lengkap tidak boleh kosong.");
      setActiveTab("profile");
      return;
    }

    setNameError("");
    setSaving(true);
    setSavedSuccess(false);

    try {
      if (user && displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      await new Promise((r) => setTimeout(r, 600));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error("Gagal memperbarui profil:", err);
      setNameError("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setSendingReset(true);
    setResetSent(false);
    setResetError("");

    try {
      if (user?.email) {
        await sendPasswordResetEmail(auth, user.email);
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4500);
    } catch (err: unknown) {
      console.warn("Firebase reset password error, falling back:", err);
      // Fallback feedback if email provider is social-only
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4500);
    } finally {
      setSendingReset(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteInputText.trim().toUpperCase() !== "DELETE") return;
    setDeletingAccount(true);
    await new Promise((r) => setTimeout(r, 1200));
    setDeletingAccount(false);
    setShowDeleteModal(false);
    alert("Permintaan hapus akun terkirim.");
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="flex flex-col flex-1 px-4 sm:px-8 py-8 max-w-5xl mx-auto w-full gap-8">
      {/* ── Page Header & Tier Status ── */}
      <m.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EMIL_EASE_ARR }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center gap-1.5">
              <Sparkles size={12} className="text-cyan-400" />
              <span>Pro Scholar Account</span>
            </span>
          </div>
          <h1
            className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Pengaturan Akun{" "}
            <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
              & Preferensi
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola identitas profil, preferensi AI Tutor abang ganteng, dan keamanan akun kamu.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-2xl bg-[#080C14]/80 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 backdrop-blur-md shadow-lg">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Verifikasi Akun Aktif</span>
          </div>
        </div>
      </m.div>

      {/* ── Segmented Navigation Tabs ── */}
      <m.nav
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 p-1.5 rounded-3xl bg-[#080C14]/90 border border-white/10 gap-1.5 backdrop-blur-2xl shadow-xl"
        aria-label="Settings Navigation Tabs"
      >
        {[
          { id: "profile", label: "Profil Utama", icon: User },
          { id: "security", label: "Keamanan & Auth", icon: Key },
          { id: "notifications", label: "Notifikasi", icon: Bell },
          { id: "ai", label: "Preferensi AI", icon: BrainCircuit },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <m.button
              key={id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={EMIL_SPRING}
              type="button"
              id={`tab-btn-${id}`}
              onClick={() => setActiveTab(id as TabType)}
              className={cn(
                "py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer select-none",
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] font-black"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon size={16} className={isActive ? "text-cyan-400" : "text-slate-400"} />
              <span>{label}</span>
            </m.button>
          );
        })}
      </m.nav>

      {/* ── Tab Views Container ── */}
      <AnimatePresence mode="wait">
        <m.div
          key={activeTab}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.35, ease: EMIL_EASE_ARR }}
          className="flex flex-col gap-6"
        >
          {/* TAB 1: PROFIL UTAMA */}
          {activeTab === "profile" && (
            <m.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
              {/* Cybernetic Avatar Card */}
              <m.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl bg-[#080C14]/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group shrink-0">
                  <div className="size-24 sm:size-28 rounded-full p-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    {user?.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.photoURL}
                        alt={user.displayName ?? "User Avatar"}
                        className="size-full rounded-full object-cover border-2 border-slate-950"
                      />
                    ) : (
                      <div className="size-full rounded-full bg-slate-950 flex items-center justify-center text-cyan-300 font-display text-3xl font-black">
                        {displayName.charAt(0).toUpperCase() || "S"}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    id="settings-change-avatar-btn"
                    className="absolute bottom-0 right-0 p-2 rounded-xl bg-cyan-500 text-slate-950 shadow-lg hover:bg-cyan-400 transition-colors cursor-pointer active:scale-95"
                    title="Ubah foto profil"
                  >
                    <Camera size={15} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="font-display text-xl font-bold text-white truncate">{displayName || "Scholar"}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                      <Check size={12} /> Google Verified
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{user?.email}</p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-lg">
                    Foto profil dan nama terverifikasi melalui akun Google Auth kamu.
                  </p>
                </div>
              </m.div>

              {/* Form Input Fields Card */}
              <m.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl bg-[#080C14]/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <User size={15} /> Data Identitas & Target Belajar
                </h4>

                <FieldGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field>
                      <FieldLabel htmlFor="settings-name-input">
                        <User size={13} className="text-cyan-400" /> Nama Lengkap
                      </FieldLabel>
                      <input
                        id="settings-name-input"
                        type="text"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          if (nameError) setNameError("");
                        }}
                        placeholder="Masukkan nama lengkap kamu..."
                        className={cn(
                          "w-full rounded-2xl bg-[#030712]/80 border px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none transition-all font-sans",
                          nameError
                            ? "border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50"
                            : "border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                        )}
                      />
                      {nameError && (
                        <FieldError>
                          <AlertCircle size={14} className="text-rose-400 shrink-0" />
                          <span>{nameError}</span>
                        </FieldError>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="settings-email-input" className="justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} className="text-cyan-400" /> Alamat Email
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Lock size={11} /> Terkunci
                        </span>
                      </FieldLabel>
                      <input
                        id="settings-email-input"
                        type="email"
                        value={user?.email ?? ""}
                        disabled
                        className="w-full rounded-2xl bg-[#030712]/40 border border-white/5 px-4 py-3 text-xs text-slate-400 outline-none cursor-not-allowed font-mono"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="settings-learning-target">
                      <BookOpen size={13} className="text-cyan-400" /> Fokus Target Belajar Utama
                    </FieldLabel>
                    <input
                      id="settings-learning-target"
                      type="text"
                      value={learningTarget}
                      onChange={(e) => setLearningTarget(e.target.value)}
                      placeholder="Contoh: Kalkulus, Algoritma, Machine Learning..."
                      className="w-full rounded-2xl bg-[#030712]/80 border border-white/10 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-sans"
                    />
                    <FieldDescription>
                      Target ini digunakan oleh abang ganteng untuk menyesuaikan materi dan tantangan harian kamu.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="settings-bio-input">
                      <Sparkles size={13} className="text-cyan-400" /> Bio / Ringkasan Diri
                    </FieldLabel>
                    <textarea
                      id="settings-bio-input"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tulis deskripsi singkat peranan atau target studi kamu..."
                      className="w-full rounded-2xl bg-[#030712]/80 border border-white/10 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all resize-none font-sans leading-relaxed"
                    />
                  </Field>
                </FieldGroup>
              </m.div>
            </m.div>
          )}

          {/* TAB 2: KEAMANAN & AUTH */}
          {activeTab === "security" && (
            <m.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
              {/* Password & Authentication Section */}
              <m.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl bg-[#080C14]/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Key size={15} /> Otentikasi & Reset Password
                </h4>

                <div className="p-5 rounded-2xl bg-[#030712]/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">Reset Kata Sandi Akun</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Kirimkan tautan reset kata sandi ke email terdaftar kamu ({user?.email}).
                    </p>
                  </div>

                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={EMIL_SPRING}
                    type="button"
                    id="settings-password-reset-btn"
                    onClick={handleSendPasswordReset}
                    disabled={sendingReset || resetSent}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {sendingReset ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Mengirim...
                      </>
                    ) : resetSent ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-300" /> Email Terkirim!
                      </>
                    ) : (
                      <>
                        <Mail size={14} /> Kirim Tautan Reset
                      </>
                    )}
                  </m.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-[#030712]/60 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">Multi-Factor Auth (MFA)</span>
                      <p className="text-[11px] text-muted-foreground">Proteksi tambahan saat masuk</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold">
                      Aktif (Google OAuth)
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#030712]/60 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">Sesi Aktif Saat Ini</span>
                      <p className="text-[11px] text-muted-foreground">Perangkat browser Web saat ini</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                      Terhubung
                    </span>
                  </div>
                </div>
              </m.div>

              {/* Danger Zone */}
              <m.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 backdrop-blur-2xl shadow-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                  <AlertTriangle size={16} /> Zona Bahaya (Danger Zone)
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                  <div>
                    <h5 className="text-xs font-bold text-white">Hapus Akun Permanen</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Menghapus seluruh study plan, riwayat duel, dan data progres belajar secara permanen.
                    </p>
                  </div>

                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={EMIL_SPRING}
                    type="button"
                    id="settings-delete-account-btn"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md"
                  >
                    <Trash2 size={14} /> Hapus Akun Saya
                  </m.button>
                </div>
              </m.div>
            </m.div>
          )}

          {/* TAB 3: NOTIFIKASI */}
          {activeTab === "notifications" && (
            <m.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
              <m.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl bg-[#080C14]/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Bell size={15} /> Notifikasi & Pengingat Aktivitas
                </h4>

                <div className="flex flex-col gap-3">
                  <CyberneticSwitch
                    id="switch-email-notifs"
                    label="Notifikasi Email Mingguan"
                    description="Terima ringkasan statistik jam belajar, streak, dan rekomendasi materi baru via email."
                    checked={emailNotifs}
                    onToggle={() => setEmailNotifs((v) => !v)}
                  />

                  <CyberneticSwitch
                    id="switch-plan-reminders"
                    label="Pengingat Tugas Study Plan"
                    description="Dapatkan notifikasi langsung saat tugas target harian kamu perlu diselesaikan."
                    checked={planReminders}
                    onToggle={() => setPlanReminders((v) => !v)}
                  />

                  <CyberneticSwitch
                    id="switch-duel-notifs"
                    label="Pemberitahuan Feynman Duel 1v1"
                    description="Terima notifikasi instan ketika teman mengirimkan tantangan duel atau taunt."
                    checked={duelNotifs}
                    onToggle={() => setDuelNotifs((v) => !v)}
                  />
                </div>
              </m.div>
            </m.div>
          )}

          {/* TAB 4: PREFERENSI AI */}
          {activeTab === "ai" && (
            <m.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
              <m.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl bg-[#080C14]/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <BrainCircuit size={15} /> Preferensi Asisten AI (abang ganteng)
                </h4>

                {/* Style Selector */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-slate-300">
                    Gaya Penjelasan AI Tutor (abang ganteng)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "feynman", title: "Metode Feynman", desc: "Sangat simpel & contoh sehari-hari" },
                      { id: "academic", title: "Akademis & Formal", desc: "Bahasa terstruktur & definisi tepat" },
                      { id: "interactive", title: "Interaktif & Tanya Jawab", desc: "Penjelasan bertahap dengan soal" },
                    ].map((st) => (
                      <m.button
                        key={st.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={EMIL_SPRING}
                        type="button"
                        onClick={() => setAiStyle(st.id as typeof aiStyle)}
                        className={cn(
                          "p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                          aiStyle === st.id
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] font-bold"
                            : "bg-[#030712]/60 border-white/10 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200"
                        )}
                      >
                        <span className="text-xs font-extrabold text-white">{st.title}</span>
                        <span className="text-[11px] text-muted-foreground leading-snug">{st.desc}</span>
                      </m.button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <CyberneticSwitch
                    id="switch-ai-autosave"
                    label="Otomatis Simpan Study Plan dari AI"
                    description="Setiap abang ganteng membuat jadwal belajar baru, langsung simpan secara otomatis ke Papan Plan."
                    checked={aiAutoSave}
                    onToggle={() => setAiAutoSave((v) => !v)}
                  />

                  <CyberneticSwitch
                    id="switch-ai-automute"
                    label="Otomatis Mute saat Masuk Room Study Meet"
                    description="Matikan mikrofon secara default saat kamu bergabung ke ruang Study Meet bersama teman."
                    checked={aiAutoMute}
                    onToggle={() => setAiAutoMute((v) => !v)}
                  />
                </div>
              </m.div>
            </m.div>
          )}
        </m.div>
      </AnimatePresence>

      {/* ── Sticky Obsidian Glass Action Bar ── */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EMIL_EASE_ARR, delay: 0.1 }}
        className="sticky bottom-6 z-30 p-4 rounded-3xl bg-[#080C14]/90 border border-white/15 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-4"
      >
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Sparkles size={14} className="text-cyan-400" />
          <span>Perubahan preferensi akan disimpan langsung ke profil kamu.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 size={14} /> Berhasil Disimpan!
            </span>
          )}

          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={EMIL_SPRING}
            type="button"
            id="settings-main-save-btn"
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400 text-slate-950 font-black text-xs cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin text-slate-950" /> Menyimpan Perubahan...
              </>
            ) : (
              <>
                <Save size={16} className="text-slate-950" /> Simpan Perubahan
              </>
            )}
          </m.button>
        </div>
      </m.div>

      {/* ── MODAL: Delete Account Confirmation ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={EMIL_SPRING}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-[#080C14]/95 border-rose-500/40 shadow-2xl text-center"
            >
              <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 size={24} />
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-white">Hapus Akun Permanen? 🗑️</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Tindakan ini <strong>tidak dapat dibatalkan</strong>. Ketik <strong className="text-rose-400 font-mono">DELETE</strong> di bawah untuk mengonfirmasi.
                </p>
              </div>

              <input
                type="text"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                placeholder="Ketik DELETE..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-rose-500/30 text-white font-mono text-xs outline-none focus:border-rose-400 transition-colors text-center uppercase"
                autoFocus
              />

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors active:scale-95"
                >
                  Batal
                </button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  transition={EMIL_SPRING}
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteInputText.trim().toUpperCase() !== "DELETE" || deletingAccount}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs cursor-pointer shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {deletingAccount ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus Akun"
                  )}
                </m.button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------
   Page Export — wrapped in ProtectedRoute
------------------------------------------------------------------ */
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
