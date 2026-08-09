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
  Send,
  Mic,
  MicOff,
  Cpu,
  Layers,
  Zap,
  Sliders,
  RefreshCw,
  MessageSquarePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
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
  planId?: string;
}

interface StudyProfileData {
  level: "SMA" | "Kuliah";
  major: string;
  yearOrSemester: string;
  subject: string;
}

/* ------------------------------------------------------------------
   High-Density Bento Quick Starter Prompts
------------------------------------------------------------------ */
const SUGGESTIONS = [
  {
    title: "Kalkulus & MatDas",
    desc: "Bantu aku persiapan ujian Kalkulus Lanjut dan Pemahaman Konsep",
    text: "Bantu aku persiapan ujian Kalkulus",
    category: "Math & Analytics",
    Icon: Calculator,
    gradient: "from-cyan-500/20 via-sky-500/10 to-transparent",
    accentColor: "#06b6d4",
  },
  {
    title: "AI & Machine Learning",
    desc: "Buatkan study plan 14 hari kuasai Supervised & Unsupervised Learning",
    text: "Buatkan study plan Machine Learning",
    category: "Computer Science",
    Icon: BrainCircuit,
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    accentColor: "#8b5cf6",
  },
  {
    title: "Code Review & Algo",
    desc: "Review Algoritma Dynamic Programming & Data Structures",
    text: "Review Algoritma & Struktur Data",
    category: "Engineering",
    Icon: Code2,
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    accentColor: "#10b981",
  },
  {
    title: "Kimia Organik & Sains",
    desc: "Bedah struktur molekul dan mekanisme reaksi kimia organik",
    text: "Bantu aku belajar Kimia Organik",
    category: "Natural Science",
    Icon: FlaskConical,
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    accentColor: "#38bdf8",
  },
] as const;

/* ------------------------------------------------------------------
   Animation Constants & Motion Curves (Apple & Emil Kowalski Style)
------------------------------------------------------------------ */
const EMIL_EASE_ARR: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EMIL_SPRING = { type: "spring" as const, stiffness: 380, damping: 28 };

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.45, ease: EMIL_EASE_ARR } },
};

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EMIL_EASE_ARR } },
};

const toastVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: EMIL_EASE_ARR } },
  exit: { opacity: 0, y: 12, scale: 0.94, transition: { duration: 0.2, ease: EMIL_EASE_ARR } },
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
      className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl min-w-[280px] max-w-[360px] pointer-events-auto ${
        isSuccess
          ? "bg-[#080C14]/95 border-emerald-500/40 text-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
          : "bg-[#080C14]/95 border-rose-500/40 text-rose-300 shadow-[0_10px_30px_rgba(244,63,94,0.15)]"
      }`}
    >
      <div
        className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isSuccess
            ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-400"
            : "bg-rose-500/20 border border-rose-400/30 text-rose-400"
        }`}
        aria-hidden="true"
      >
        {isSuccess ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-xs text-white leading-snug">
          {toast.title}
        </p>
        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
          {toast.body}
        </p>

        {isSuccess && toast.planId && (
          <button
            type="button"
            onClick={() => router.push("/dashboard/plan")}
            className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer active:scale-95 transition-transform"
          >
            <span>Lihat di Papan Plan</span>
            <ExternalLink size={11} aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer shrink-0"
      >
        <X size={14} />
      </button>
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Typing Indicator Component (Sleek Obsidian & Cyan Pulse)
------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <m.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="flex items-start gap-3 max-w-[80%] self-start"
    >
      <div
        className="size-9 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-950 to-violet-950 border border-cyan-500/40 text-cyan-300 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        aria-hidden="true"
      >
        <BrainCircuit size={18} />
      </div>
      <div
        className="px-4 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-3 border border-white/10 bg-[#080C14]/90 backdrop-blur-xl shadow-xl"
        aria-label="abang ganteng sedang meramu jawaban"
        role="status"
      >
        <span className="text-xs text-cyan-300 font-medium font-sans">abang ganteng sedang meramu jawaban</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-cyan-400 inline-block animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Message Bubble Component
------------------------------------------------------------------ */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return <h3 key={i} className="font-display font-bold text-sm sm:text-base text-white mb-2 mt-1">{line.replace("## ", "")}</h3>;
      if (line.startsWith("**") && line.endsWith("**"))
        return <p key={i} className="font-bold text-cyan-300 mt-2.5 mb-1 text-xs">{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("- "))
        return <p key={i} className="flex gap-2 text-slate-200 text-xs pl-2 my-0.5"><span className="text-cyan-400 shrink-0 mt-0.5">•</span><span>{line.replace("- ", "")}</span></p>;
      if (/^\d+\.\s/.test(line))
        return <p key={i} className="text-slate-200 text-xs pl-3 my-0.5">{line}</p>;
      if (line.startsWith("|"))
        return <p key={i} className="font-mono text-[11px] text-slate-300 bg-slate-950/60 p-1.5 rounded border border-white/10 overflow-x-auto my-1">{line}</p>;
      if (line.startsWith("> "))
        return <p key={i} className="border-l-2 border-cyan-400 pl-3 text-slate-300 text-xs italic my-2 py-0.5 bg-cyan-950/20 rounded-r">{line.replace("> ", "")}</p>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-slate-200 text-xs sm:text-xs leading-relaxed">{line}</p>;
    });
  }

  return (
    <m.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-start gap-3 max-w-[88%] sm:max-w-[82%] ${
        isUser ? "ml-auto flex-row-reverse self-end" : "self-start"
      }`}
    >
      {!isUser && (
        <div
          className="size-9 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-950 via-slate-900 to-violet-950 border border-cyan-500/40 text-cyan-300 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
          aria-hidden="true"
        >
          <BrainCircuit size={18} />
        </div>
      )}
      <div
        className={`px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-xl flex flex-col gap-1.5 ${
          isUser
            ? "bg-gradient-to-r from-cyan-950/80 via-sky-950/80 to-violet-950/80 border-cyan-500/30 rounded-tr-none text-white shadow-[0_4px_25px_rgba(6,182,212,0.15)]"
            : "bg-[#080C14]/90 border-white/10 rounded-tl-none text-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
        }`}
      >
        {isUser ? (
          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">{msg.content}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {renderContent(msg.content)}
          </div>
        )}
        <p className={`text-[10px] text-slate-400/80 mt-1 font-mono ${isUser ? "text-right" : "text-left"}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Guided Setup & Profile Wizard Component
------------------------------------------------------------------ */
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

const SMA_MAJORS = ["IPA / MIPA", "IPS", "Bahasa", "SMK / Kejuruan"];

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

const SMA_CLASSES = ["Kelas 10 (X)", "Kelas 11 (XI)", "Kelas 12 (XII)"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md animate-fadeIn">
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="max-w-lg w-full rounded-3xl p-7 flex flex-col gap-6 border border-cyan-500/30 bg-[#080C14]/95 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                Atur Profil Belajar ✨
              </h3>
              <p className="text-xs text-slate-400">Langkah {step} dari 4</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all ${
                  s === step
                    ? "bg-cyan-400 w-5 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                    : s < step
                    ? "bg-cyan-500/40 w-2.5"
                    : "bg-slate-800 w-2.5"
                }`}
              />
            ))}
            <button
              type="button"
              onClick={onClose}
              className="ml-3 text-slate-400 hover:text-white transition-colors p-1 cursor-pointer active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h4 className="font-display text-base font-bold text-white mb-1">
                Pilih Jenjang Pendidikan Kamu
              </h4>
              <p className="text-xs text-slate-300">
                Pilih tingkat studi kamu agar abang ganteng bisa menyesuaikan tingkat kesulitan dan gaya penjelasan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <m.button
                type="button"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={EMIL_SPRING}
                onClick={() => handleSelectLevel("Kuliah")}
                className="flex flex-col gap-3 p-5 rounded-2xl bg-[#080C14] hover:bg-slate-900/90 border border-white/10 hover:border-cyan-400/50 text-left transition-all cursor-pointer group shadow-md"
              >
                <div className="size-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h5 className="font-display text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Kuliah / Perguruan Tinggi
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mahasiswa (S1, D3, D4) dengan materi perkuliahan spesifik.
                  </p>
                </div>
              </m.button>

              <m.button
                type="button"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={EMIL_SPRING}
                onClick={() => handleSelectLevel("SMA")}
                className="flex flex-col gap-3 p-5 rounded-2xl bg-[#080C14] hover:bg-slate-900/90 border border-white/10 hover:border-violet-400/50 text-left transition-all cursor-pointer group shadow-md"
              >
                <div className="size-10 rounded-2xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center text-violet-300 group-hover:scale-110 transition-transform">
                  <School size={22} />
                </div>
                <div>
                  <h5 className="font-display text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                    SMA / Sederajat
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Siswa SMA, SMK, MA, atau sederajat.
                  </p>
                </div>
              </m.button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h4 className="font-display text-base font-bold text-white mb-1">
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      active
                        ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                        : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10"
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  isCustomMajor
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                    : "bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40"
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
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-cyan-400/40 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-400"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer active:scale-95"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <m.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-xs px-6 py-2.5 font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <span>Lanjut</span>
                <ArrowRight size={14} />
              </m.button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h4 className="font-display text-base font-bold text-white mb-1">
                {level === "Kuliah" ? "Saat Ini Kamu Semester Berapa?" : "Saat Ini Kamu Kelas Berapa?"}
              </h4>
              <p className="text-xs text-slate-300">
                Informasi ini membantu abang ganteng menyesuaikan kedalaman konteks.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
              {(level === "Kuliah" ? KULIAH_SEMESTERS : SMA_CLASSES).map((item) => {
                const active = selectedYearOrSemester === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSelectedYearOrSemester(item)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer active:scale-95 ${
                      active
                        ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 border border-cyan-300"
                        : "bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10"
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
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer active:scale-95"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <m.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-xs px-6 py-2.5 font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <span>Lanjut</span>
                <ArrowRight size={14} />
              </m.button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h4 className="font-display text-base font-bold text-white mb-1">
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
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-white text-xs outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
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
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer active:scale-95"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <m.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={handleFinish}
                disabled={!canProceedStep4}
                className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs px-6 py-3 font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <Sparkles size={15} />
                <span>Mulai Sesi Tutor ✨</span>
              </m.button>
            </div>
          </div>
        )}
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Tutor Content Main View
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
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toggleVoiceMode = () => {
    const nextState = !isVoiceActive;
    setIsVoiceActive(nextState);
    if (nextState) {
      pushToast({
        variant: "success",
        title: "Voice Assistant Mode",
        body: "Mode audio aktif. Ketik pesan atau gunakan mikrofon untuk mulai berdiskusi.",
      });
    }
  };

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
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsTyping(true);

    const currentProfile = profileOverride || activeProfile;

    try {
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

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

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
        content: "## ⚠️ Gagal Mengakses AI Service\n\nMaaf, koneksi ke server AI Tutor terganggu. Silakan periksa jaringan kamu dan coba lagi.",
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

  const handleResetChat = () => {
    setMessages([]);
    pushToast({
      variant: "success",
      title: "Sesi Diset Ulang",
      body: "Riwayat chat telah dibersihkan. Siap memulai topik baru!",
    });
  };

  const displayName = user?.displayName?.split(" ")[0] ?? "Scholar";
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden max-w-5xl mx-auto w-full px-3 sm:px-6 pt-5 pb-3 relative">
      {/* Toast Notification Container */}
      <div
        aria-label="Notifications"
        className="fixed bottom-8 right-8 z-50 flex flex-col gap-2.5 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastNotification key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Header & Cybernetic Context Indicator */}
      <m.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EMIL_EASE_ARR }}
        className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 shrink-0"
      >
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-950 via-slate-900 to-violet-950 border border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <BrainCircuit size={22} />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                AI Tutor Belajar
              </span>{" "}
              <span className="text-xs font-semibold text-cyan-400/90 font-mono">(abang ganteng)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Teman belajar adaptif & pembuat study plan otomatis</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Active Context Indicator / Cybernetic Glass Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#080C14]/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-sm">
            <Cpu size={14} className="text-cyan-400 animate-pulse" />
            <span className="truncate max-w-[200px]">
              {activeProfile ? `${activeProfile.subject} (${activeProfile.level})` : "Mode Adaptif General"}
            </span>
          </div>

          <button
            type="button"
            id="tutor-setup-profile-btn"
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Sliders size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">Atur Profil Belajar</span>
            <span className="sm:hidden">Profil</span>
          </button>

          {!isEmpty && (
            <button
              type="button"
              onClick={handleResetChat}
              title="Reset Chat"
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} />
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest hidden sm:inline">ONLINE</span>
          </div>
        </div>
      </m.div>

      {/* Chat Viewport: Obsidian Glass Container */}
      <div
        className="flex-1 overflow-y-auto py-5 px-1 sm:px-2 flex flex-col gap-4 bg-[#080C14]/90 border border-white/10 backdrop-blur-xl rounded-2xl my-3 shadow-inner space-y-2"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <AnimatePresence>
          {isEmpty && !isTyping && (
            <m.div
              key="empty-state"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="flex flex-col items-center gap-6 py-4 my-auto"
            >
              <m.div variants={itemVariants} className="text-center flex flex-col items-center gap-3">
                <div className="size-16 rounded-3xl flex items-center justify-center bg-gradient-to-br from-cyan-950 via-slate-900 to-violet-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.25)]">
                  <BrainCircuit size={32} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    Halo, {displayName}! 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md leading-relaxed">
                    Tanya materi apa saja — abang ganteng siap bantu buatkan study plan adaptif khusus buat kamu.
                  </p>
                </div>
              </m.div>

              {/* Template Prompt Featured Card */}
              <m.button
                type="button"
                id="tutor-guided-setup-card"
                variants={itemVariants}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={EMIL_SPRING}
                onClick={() => setShowWizard(true)}
                className="flex items-center justify-between w-full max-w-2xl p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-violet-950/60 border border-cyan-500/40 hover:border-cyan-400 shadow-xl cursor-pointer transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Pakai Template Prompt / Guided Setup ✨</p>
                    <p className="text-xs text-slate-300 mt-0.5">Atur jurusan & tingkat pendidikan kamu untuk penjelasan AI Tutor yang presisi</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-cyan-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </m.button>

              {/* Bento Quick Starter Prompt Cards */}
              <m.div
                variants={containerVariants}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl"
              >
                {SUGGESTIONS.map(({ title, desc, text, category, Icon, gradient, accentColor }) => (
                  <m.button
                    key={title}
                    type="button"
                    variants={itemVariants}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={EMIL_SPRING}
                    onClick={() => sendMessage(text)}
                    className={`p-4 rounded-2xl border border-white/10 hover:border-cyan-500/40 bg-gradient-to-br ${gradient} bg-[#080C14]/90 backdrop-blur-xl transition-all text-left cursor-pointer group flex flex-col justify-between gap-3 shadow-md`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                        {category}
                      </span>
                      <div
                        className="size-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10 bg-slate-950 group-hover:scale-110 transition-transform"
                        style={{ color: accentColor }}
                      >
                        <Icon size={16} />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-display text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {desc}
                      </p>
                    </div>

                    <div className="flex items-center text-[11px] font-bold text-cyan-400 group-hover:translate-x-1 transition-transform gap-1">
                      <span>Mulai Topik</span>
                      <ChevronRight size={13} />
                    </div>
                  </m.button>
                ))}
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Dock & Controls */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EMIL_EASE_ARR, delay: 0.1 }}
        className="shrink-0 pt-1 pb-1 flex flex-col gap-2"
      >
        <div className="flex flex-col gap-2 bg-[#080C14]/90 border border-white/15 focus-within:border-cyan-400 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.25)] rounded-3xl p-3 sm:p-3.5 backdrop-blur-2xl transition-all shadow-2xl">
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
            className="w-full bg-transparent border-none outline-none resize-none text-white text-xs sm:text-sm font-sans leading-relaxed min-h-[1.5rem] max-h-[140px] overflow-y-auto px-2 pt-1"
          />

          {/* Action Dock Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleVoiceMode}
                title={isVoiceActive ? "Matikan Voice Assistant" : "Aktifkan Voice Assistant"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  isVoiceActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
                }`}
              >
                {isVoiceActive ? <Mic size={14} className="text-cyan-400 animate-pulse" /> : <MicOff size={14} />}
                <span className="hidden sm:inline">{isVoiceActive ? "Voice On" : "Voice Off"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles size={13} className="text-cyan-400" />
                <span className="hidden sm:inline">Guided Setup</span>
              </button>
            </div>

            <m.button
              type="button"
              id="tutor-send-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={EMIL_SPRING}
              onClick={() => sendMessage(input)}
              disabled={isTyping || !input.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Send size={15} />
            </m.button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Tekan <kbd className="bg-white/10 border border-white/15 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">Enter</kbd> untuk kirim &nbsp;·&nbsp; <kbd className="bg-white/10 border border-white/15 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">Shift+Enter</kbd> untuk baris baru
        </p>
      </m.div>

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
