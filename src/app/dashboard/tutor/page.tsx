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
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LiquidMetalButton from "@/components/ui/liquid-metal-button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { saveStudyPlan } from "@/lib/firebase/db";
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
   Tutor Page Content
------------------------------------------------------------------ */
function TutorContent() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
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
  async function sendMessage(text: string) {
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

    try {
      /* ── 1. Call API route ── */
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
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
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(34,197,94,0.9)", display: "inline-block", boxShadow: "0 0 6px rgba(34,197,94,0.6)", animation: "pulse-dot 2s ease-in-out infinite" }} />
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(34,197,94,0.9)", letterSpacing: "0.06em" }}>ONLINE</span>
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
