"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { m, AnimatePresence, type Variants } from "framer-motion";
import {
  BrainCircuit,
  BookOpen,
  Calculator,
  FlaskConical,
  Code2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
  GraduationCap,
  School,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LiquidMetalButton from "@/components/ui/liquid-metal-button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { saveStudyPlan } from "@/lib/firebase/db";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import type { StudyPlanPayload } from "@/app/api/chat/route";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------ */
type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

type ToastVariant = "success" | "error";

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  body: string;
  planId?: string; // Firestore doc ID for "View Plan" link
}

/* ------------------------------------------------------------------
   Prompt Suggestions
------------------------------------------------------------------ */
const SUGGESTIONS = [
  { Icon: Calculator, text: "Bantu aku persiapan ujian Kalkulus",       color: "rgba(56, 189, 248, 0.8)"  },
  { Icon: BrainCircuit, text: "Buatkan study plan Machine Learning",    color: "rgba(245, 158, 11, 0.8)"  },
  { Icon: Code2,  text: "Review Algoritma & Struktur Data",             color: "rgba(34, 197, 94, 0.8)"   },
  { Icon: FlaskConical, text: "Bantu aku belajar Kimia Organik",        color: "rgba(168, 85, 247, 0.8)"  },
  { Icon: BookOpen, text: "Buatkan plan 7 hari persiapan ujian",        color: "rgba(239, 68, 68, 0.8)"   },
] as const;

/* ------------------------------------------------------------------
   Animation Variants
------------------------------------------------------------------ */
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: EASE } },
};

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE } },
};

const toastVariants: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.94 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.3, ease: EASE } },
  exit:    { opacity: 0, y: 12, scale: 0.94, transition: { duration: 0.2, ease: EASE } },
};

/* ------------------------------------------------------------------
   Toast Component
------------------------------------------------------------------ */
function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();
  const isSuccess = toast.variant === "success";

  return (
    <m.div
      layout
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.875rem 1rem",
        borderRadius: "14px",
        background: isSuccess
          ? "linear-gradient(135deg, rgba(6,16,46,0.92) 0%, rgba(16,36,80,0.88) 100%)"
          : "rgba(30, 8, 8, 0.92)",
        border: isSuccess
          ? "1px solid rgba(34, 197, 94, 0.28)"
          : "1px solid rgba(239, 68, 68, 0.28)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: isSuccess
          ? "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(34,197,94,0.08) inset"
          : "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(239,68,68,0.08) inset",
        minWidth: "280px",
        maxWidth: "340px",
        pointerEvents: "all",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "1.75rem",
          height: "1.75rem",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isSuccess ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
          border: isSuccess ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.25)",
          flexShrink: 0,
          marginTop: "2px",
        }}
        aria-hidden="true"
      >
        {isSuccess ? (
          <CheckCircle2 size={14} style={{ color: "rgba(34,197,94,0.9)" }} />
        ) : (
          <AlertCircle size={14} style={{ color: "rgba(239,68,68,0.9)" }} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 600,
            fontSize: "0.8125rem",
            color: "var(--color-silver-50)",
            lineHeight: 1.3,
          }}
        >
          {toast.title}
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-silver-400)",
            marginTop: "0.2rem",
            lineHeight: 1.4,
          }}
        >
          {toast.body}
        </p>

        {/* "View Plan" CTA */}
        {isSuccess && toast.planId && (
          <button
            type="button"
            onClick={() => router.push("/dashboard/plan")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              marginTop: "0.5rem",
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "rgba(34,197,94,0.9)",
              letterSpacing: "0.04em",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Lihat di Papan Plan
            <ExternalLink size={10} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.25rem",
          height: "1.25rem",
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--color-silver-400)",
          borderRadius: "4px",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <X size={12} />
      </button>
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Typing Indicator
------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <m.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", maxWidth: "80%" }}
    >
      <div
        style={{
          width: "2rem", height: "2rem", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <BrainCircuit size={14} style={{ color: "var(--color-gold-400)" }} />
      </div>
      <div
        style={{
          background: "rgba(6,16,46,0.8)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0 14px 14px 14px", padding: "0.75rem 1rem",
          backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: "4px",
        }}
        aria-label="AI is typing"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--color-gold-400)", display: "inline-block",
              animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Message Bubble
------------------------------------------------------------------ */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return <p key={i} style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "1rem", color: "var(--color-silver-50)", marginBottom: "0.5rem" }}>{line.replace("## ", "")}</p>;
      if (line.startsWith("**") && line.endsWith("**"))
        return <p key={i} style={{ fontWeight: 700, color: "var(--color-gold-300)", marginTop: "0.5rem", marginBottom: "0.15rem" }}>{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("- "))
        return <p key={i} style={{ display: "flex", gap: "0.5rem", color: "var(--color-silver-200)", fontSize: "0.8125rem", paddingLeft: "0.25rem" }}><span style={{ color: "var(--color-gold-400)", marginTop: "2px" }}>·</span>{line.replace("- ", "")}</p>;
      if (/^\d+\.\s/.test(line))
        return <p key={i} style={{ color: "var(--color-silver-200)", fontSize: "0.8125rem", paddingLeft: "0.5rem" }}>{line}</p>;
      if (line.startsWith("|"))
        return <p key={i} style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--color-silver-300)" }}>{line}</p>;
      if (line.startsWith("> "))
        return <p key={i} style={{ borderLeft: "3px solid var(--color-gold-400)", paddingLeft: "0.75rem", color: "var(--color-silver-300)", fontSize: "0.8125rem", fontStyle: "italic", marginTop: "0.5rem" }}>{line.replace("> ", "")}</p>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} style={{ color: "var(--color-silver-200)", fontSize: "0.8125rem", lineHeight: 1.6 }}>{line}</p>;
    });
  }

  return (
    <m.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: "0.75rem",
        maxWidth: "85%",
        alignSelf: isUser ? "flex-end" : "flex-start",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: "2rem", height: "2rem", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <BrainCircuit size={14} style={{ color: "var(--color-gold-400)" }} />
        </div>
      )}
      <div
        style={{
          background: isUser
            ? "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.12) 100%)"
            : "rgba(6,16,46,0.8)",
          border: isUser ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: isUser ? "14px 0 14px 14px" : "0 14px 14px 14px",
          padding: "0.875rem 1.125rem",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", gap: "0.25rem",
        }}
      >
        {isUser ? (
          <p style={{ color: "var(--color-silver-50)", fontSize: "0.875rem", lineHeight: 1.6 }}>{msg.content}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            {renderContent(msg.content)}
          </div>
        )}
        <p style={{ fontSize: "0.6875rem", color: "var(--color-silver-400)", textAlign: isUser ? "right" : "left", marginTop: "0.25rem" }}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Guided Setup & Profile Wizard Types & Component
------------------------------------------------------------------ */
interface StudyProfileData {
  level: "SMA" | "Kuliah";
  major: string;
  yearOrSemester: string;
  subject: string;
}

const KULIAH_MAJORS = [
  "Teknik Informatika",
  "Sistem Informasi",
  "Manajemen",
  "Akuntansi",
  "Psikologi",
  "Hukum",
  "Teknik Elektro",
  "Kedokteran",
];

const SMA_MAJORS = [
  "IPA / MIPA",
  "IPS",
  "Bahasa",
  "SMK / Kejuruan",
];

const KULIAH_SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8+",
];

const SMA_CLASSES = [
  "Kelas 10 (X)",
  "Kelas 11 (XI)",
  "Kelas 12 (XII)",
];

function GuidedSetupModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (profile: StudyProfileData) => void;
}) {
  const [step, setStep] = useState<number>(1);
  const [level, setLevel] = useState<"SMA" | "Kuliah" | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [customMajor, setCustomMajor] = useState<string>("");
  const [isCustomMajor, setIsCustomMajor] = useState<boolean>(false);
  const [selectedYearOrSemester, setSelectedYearOrSemester] = useState<string>("");
  const [subjectText, setSubjectText] = useState<string>("");

  const finalMajor = isCustomMajor ? customMajor.trim() : selectedMajor;

  const canProceedStep2 = Boolean(finalMajor);
  const canProceedStep3 = Boolean(selectedYearOrSemester);
  const canProceedStep4 = Boolean(subjectText.trim());

  const handleSelectLevel = (lvl: "SMA" | "Kuliah") => {
    setLevel(lvl);
    setSelectedMajor("");
    setCustomMajor("");
    setIsCustomMajor(false);
    setSelectedYearOrSemester("");
    setStep(2);
  };

  const handleFinish = () => {
    if (!level || !finalMajor || !selectedYearOrSemester || !subjectText.trim()) return;
    onComplete({
      level,
      major: finalMajor,
      yearOrSemester: selectedYearOrSemester,
      subject: subjectText.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="max-w-lg w-full rounded-3xl p-6 sm:p-7 flex flex-col gap-5 border shadow-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(6,16,46,0.96) 0%, rgba(3,11,34,0.98) 100%)",
          borderColor: "rgba(245,158,11,0.3)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245,158,11,0.1)",
        }}
      >
        {/* Header & Step Dots */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-100" style={{ fontFamily: "var(--font-outfit)" }}>
                Atur Profil Belajar ✨
              </h3>
              <p className="text-[11px] text-slate-400">Langkah {step} dari 4</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  s === step
                    ? "bg-amber-400 w-5 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                    : s < step
                    ? "bg-amber-500/40"
                    : "bg-slate-700/50"
                }`}
              />
            ))}
            <button
              type="button"
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Step 1: Jenjang Pendidikan */}
        {step === 1 && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h4 className="text-base font-bold text-slate-100 mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
                Pilih Jenjang Pendidikan Kamu
              </h4>
              <p className="text-xs text-slate-300">
                Pilih tingkat studi kamu agar abang ganteng bisa menyesuaikan tingkat kesulitan dan gaya penjelasan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
              <button
                type="button"
                onClick={() => handleSelectLevel("Kuliah")}
                className="flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-400/50 text-left transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    Kuliah / Perguruan Tinggi
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mahasiswa (S1, D3, D4) dengan materi perkuliahan spesifik.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLevel("SMA")}
                className="flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-400/50 text-left transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                  <School size={22} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    SMA / Sederajat
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Siswa SMA, SMK, MA, atau sederajat.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Jurusan */}
        {step === 2 && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h4 className="text-base font-bold text-slate-100 mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
                {level === "Kuliah" ? "Pilih Jurusan Perkulihan Kamu" : "Pilih Peminatan / Jurusan Sekolah"}
              </h4>
              <p className="text-xs text-slate-300">
                Pilih preset jurusan atau ketik manual jika tidak ada di daftar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 py-1">
              {(level === "Kuliah" ? KULIAH_MAJORS : SMA_MAJORS).map((mName) => {
                const active = !isCustomMajor && selectedMajor === mName;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setIsCustomMajor(false);
                      setSelectedMajor(mName);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                        : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setIsCustomMajor(true);
                  setSelectedMajor("");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isCustomMajor
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                    : "bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/40"
                }`}
              >
                ✏️ Input Manual...
              </button>
            </div>

            {isCustomMajor && (
              <div className="mt-1">
                <input
                  type="text"
                  placeholder="Masukkan nama jurusan kamu..."
                  value={customMajor}
                  onChange={(e) => setCustomMajor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-400/40 text-slate-100 text-xs outline-none focus:ring-1 focus:ring-amber-400"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-bold cursor-pointer"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-all"
              >
                Lanjut <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Semester / Kelas */}
        {step === 3 && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h4 className="text-base font-bold text-slate-100 mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
                {level === "Kuliah" ? "Saat Ini Kamu Semester Berapa?" : "Saat Ini Kamu Kelas Berapa?"}
              </h4>
              <p className="text-xs text-slate-300">
                Informasi ini membantu abang ganteng menyesuaikan kedalaman konteks.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1">
              {(level === "Kuliah" ? KULIAH_SEMESTERS : SMA_CLASSES).map((item) => {
                const active = selectedYearOrSemester === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSelectedYearOrSemester(item)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      active
                        ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 ring-2 ring-amber-400/50"
                        : "bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/70"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-bold cursor-pointer"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-all"
              >
                Lanjut <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Mata Kuliah / Mata Pelajaran */}
        {step === 4 && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h4 className="text-base font-bold text-slate-100 mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
                {level === "Kuliah" ? "Mata Kuliah / Topik Utama" : "Mata Pelajaran / Topik Utama"}
              </h4>
              <p className="text-xs text-slate-300">
                Tulis nama mata kuliah atau topik spesifik yang mau kamu bahas bersama abang ganteng.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder={
                  level === "Kuliah"
                    ? "Contoh: Persamaan Diferensial, Pemrograman Web, Akuntansi Keuangan..."
                    : "Contoh: Fisika - Hukum Newton, Matematika Wajib, Biologi Sel..."
                }
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 italic">
                Tips: Kamu bisa mengganti topik belajar kapan saja nanti.
              </p>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-bold cursor-pointer"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canProceedStep4}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Mulai Sesi Tutor ✨
              </button>
            </div>
          </div>
        )}
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Tutor Page Content
------------------------------------------------------------------ */
function TutorContent() {
  const { user } = useAuth();
  useStudyTimer(user?.uid);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<StudyProfileData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages / typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ----------------------------------------------------------------
     Toast helpers
  ---------------------------------------------------------------- */
  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
    // Auto-dismiss after 6 s
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  /* ----------------------------------------------------------------
     Send message → /api/chat → Firestore
  ---------------------------------------------------------------- */
  async function sendMessage(text: string, profileOverride?: StudyProfileData) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsTyping(true);

    const currentProfile = profileOverride || activeProfile;

    try {
      /* ── 1. Call API route ── */
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          userProfile: currentProfile || undefined,
        }),
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const data = (await res.json()) as { reply: string; studyPlan: StudyPlanPayload | null };

      /* ── 2. Display AI message ── */
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      /* ── 3. Save study plan to Firestore if present ── */
      if (data.studyPlan && user?.uid) {
        try {
          const docId = await saveStudyPlan(user.uid, data.studyPlan);
          pushToast({
            variant: "success",
            title: "Study plan berhasil disimpan!",
            body: `"${data.studyPlan.title}" sudah siap di Papan Plan kamu.`,
            planId: docId,
          });
        } catch {
          pushToast({
            variant: "error",
            title: "Gagal menyimpan plan",
            body: "Plan berhasil dibuat tapi gagal disimpan ke Firestore. Cek koneksi kamu ya.",
          });
        }
      }
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "## ⚠️ Something went wrong\n\nI couldn't reach the AI service. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const displayName = user?.displayName?.split(" ")[0] ?? "Scholar";
  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", overflow: "hidden", maxWidth: "860px", margin: "0 auto", width: "100%", padding: "1.5rem 1.5rem 0", position: "relative" }}>

      {/* ================================================================
          Toast Stack — fixed to the bottom-right of this container
      ================================================================ */}
      <div
        aria-label="Notifications"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
          pointerEvents: "none",
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastNotification key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* ---- Header ---- */}
      <m.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}
      >
        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)" }} aria-hidden="true">
          <BrainCircuit size={18} style={{ color: "var(--color-gold-400)" }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "1.125rem", color: "var(--color-silver-50)", lineHeight: 1.2 }}>AI Tutor</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--color-silver-400)" }}>Teman belajar adaptif kamu</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            id="tutor-setup-profile-btn"
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>Atur Profil Belajar</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(34,197,94,0.9)", display: "inline-block", boxShadow: "0 0 6px rgba(34,197,94,0.6)", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(34,197,94,0.9)", letterSpacing: "0.06em" }}>ONLINE</span>
          </div>
        </div>
      </m.div>

      {/* ---- Message Area ---- */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "1.25rem" }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {/* Empty state */}
        <AnimatePresence>
          {isEmpty && !isTyping && (
            <m.div
              key="empty-state"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", paddingTop: "2rem" }}
            >
              <m.div variants={itemVariants} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.20)", boxShadow: "0 0 32px rgba(245,158,11,0.12)" }} aria-hidden="true">
                  <BrainCircuit size={28} style={{ color: "var(--color-gold-400)" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-silver-50)" }}>Halo, {displayName}! 👋</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-silver-400)", marginTop: "0.25rem" }}>Tanya apa saja ya — aku siap bantu buatkan study plan khusus buat kamu.</p>
                </div>
              </m.div>

              {/* Template Prompt Featured Card */}
              <m.button
                type="button"
                id="tutor-guided-setup-card"
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowWizard(true)}
                className="flex items-center justify-between w-full max-w-xl p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-slate-900/40 border border-amber-400/35 hover:border-amber-400/60 shadow-lg cursor-pointer transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">Pakai Template Prompt / Guided Setup ✨</p>
                    <p className="text-xs text-slate-300">Atur jurusan & tingkat pendidikan kamu untuk penjelasan AI Tutor yang presisi</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-amber-400 shrink-0" />
              </m.button>

              <m.div
                variants={containerVariants}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", width: "100%" }}
              >
                {SUGGESTIONS.map(({ Icon, text, color }) => (
                  <m.button
                    key={text}
                    type="button"
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(text)}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", textAlign: "left", transition: "background 120ms ease, border-color 120ms ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                    aria-label={`Suggest: ${text}`}
                  >
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: `${color.replace("0.8", "0.12")}`, border: `1px solid ${color.replace("0.8", "0.22")}`, flexShrink: 0 }} aria-hidden="true">
                      <Icon size={14} style={{ color }} />
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-silver-200)", fontWeight: 500, lineHeight: 1.4 }}>{text}</span>
                    <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.2)", marginLeft: "auto", flexShrink: 0 }} aria-hidden="true" />
                  </m.button>
                ))}
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input Area ---- */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
        style={{ flexShrink: 0, padding: "1rem 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        <div
          style={{
            display: "flex", alignItems: "flex-end", gap: "0.75rem",
            background: "rgba(6,16,46,0.75)", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "16px", padding: "0.75rem 0.75rem 0.75rem 1rem",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}
        >
          <textarea
            ref={inputRef}
            id="tutor-chat-input"
            placeholder="Tanyakan apa saja — contoh: 'Bantu aku persiapan ujian Kalkulus'"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            rows={1}
            aria-label="Input pesan chat"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              resize: "none", color: "var(--color-silver-50)",
              fontFamily: "var(--font-inter)", fontSize: "0.875rem", lineHeight: 1.6,
              minHeight: "1.5rem", maxHeight: "140px", overflowY: "auto",
            }}
          />
          <LiquidMetalButton
            viewMode="icon"
            onClick={() => sendMessage(input)}
            disabled={isTyping || !input.trim()}
            id="tutor-send-button"
            aria-label="Kirim pesan"
          />
        </div>

        <p style={{ textAlign: "center", fontSize: "0.6875rem", color: "var(--color-silver-400)" }}>
          Tekan{" "}
          <kbd style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", padding: "0 4px", fontFamily: "monospace" }}>Enter</kbd>
          {" "}untuk kirim &nbsp;·&nbsp;{" "}
          <kbd style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", padding: "0 4px", fontFamily: "monospace" }}>Shift+Enter</kbd>
          {" "}untuk baris baru
        </p>
      </m.div>

      <style>{`
        @keyframes typing-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1;   }
          50%      { opacity: 0.5; }
        }
      `}</style>

      {/* Guided Setup Modal */}
      <AnimatePresence>
        {showWizard && (
          <GuidedSetupModal
            onClose={() => setShowWizard(false)}
            onComplete={(profileData) => {
              setShowWizard(false);
              setActiveProfile(profileData);
              const promptText =
                profileData.level === "Kuliah"
                  ? `Halo abang ganteng! Aku mahasiswa ${profileData.yearOrSemester} jurusan ${profileData.major}. Saat ini aku lagi fokus mempelajari mata kuliah ${profileData.subject}. Tolong bantu buatkan penjelasan dan study plan khusus buat profil belajar aku ya!`
                  : `Halo abang ganteng! Aku siswa ${profileData.yearOrSemester} jurusan ${profileData.major}. Saat ini aku lagi fokus mempelajari mata pelajaran ${profileData.subject}. Tolong bantu buatkan penjelasan dan study plan khusus buat profil belajar aku ya!`;
              sendMessage(promptText, profileData);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------
   Page Export — wrapped in ProtectedRoute
------------------------------------------------------------------ */
export default function TutorPage() {
  return (
    <ProtectedRoute>
      <TutorContent />
    </ProtectedRoute>
  );
}
