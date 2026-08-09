"use client";

import { useState, useRef, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  Check,
  BrainCircuit,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { saveStudyPlan } from "@/lib/firebase/db";
import type {
  GeneratedStudyPlanResponse,
  MaterialExplanationResponse,
} from "@/lib/ai/study-materials";
import { FieldGroup, Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type Mode = "generate-plan" | "explain";

interface MaterialUploaderProps {
  onPlanSaved?: () => void;
}

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

function renderFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-cyan-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-white/10">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function StructuredMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, i) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 font-mono text-[11px] text-cyan-300 overflow-x-auto my-2 shadow-inner"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="font-display text-xs font-bold text-cyan-300 mt-4 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          {trimmed.replace("### ", "")}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="font-display text-sm font-extrabold text-white mt-5 mb-2 border-b border-white/10 pb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
          {trimmed.replace("## ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="font-display text-base font-black text-white mt-6 mb-2">
          {trimmed.replace("# ", "")}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const textContent = trimmed.substring(2);
      elements.push(
        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200 my-1 pl-2 leading-relaxed">
          <span className="text-cyan-400 font-extrabold shrink-0 mt-0.5">•</span>
          <span>{renderFormattedText(textContent)}</span>
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      elements.push(
        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200 my-1 pl-2 leading-relaxed">
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-extrabold text-[10px] shrink-0 mt-0.5">
            {match ? match[1] : i}
          </span>
          <span>{renderFormattedText(match ? match[2] : trimmed)}</span>
        </li>
      );
    } else if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-cyan-400 pl-3 text-xs italic text-cyan-200 bg-cyan-950/20 p-2.5 rounded-r-xl my-2 leading-relaxed">
          {renderFormattedText(trimmed.replace("> ", ""))}
        </blockquote>
      );
    } else if (trimmed === "") {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(
        <p key={i} className="text-xs text-slate-200 leading-relaxed my-1">
          {renderFormattedText(line)}
        </p>
      );
    }
  });

  return <div className="space-y-1">{elements}</div>;
}

export default function MaterialUploader({ onPlanSaved }: MaterialUploaderProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [mode, setMode] = useState<Mode>("generate-plan");
  const [days, setDays] = useState<number>(7);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // AI Results
  const [planResult, setPlanResult] = useState<GeneratedStudyPlanResponse | null>(null);
  const [explainResult, setExplainResult] = useState<MaterialExplanationResponse | null>(null);

  // Firestore Save state
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Accordion state for review questions
  const [openQuestionIdx, setOpenQuestionIdx] = useState<number | null>(null);
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});

  /* ----------------------------------------------------------------
     Drag & Drop Handlers
  ---------------------------------------------------------------- */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validExtensions = ["pdf", "docx", "txt", "md"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!validExtensions.includes(ext) && !file.type.includes("text/")) {
      setError("Format file tidak didukung. Harap unggah file PDF, DOCX, TXT, atau MD ya.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Ukuran file terlalu besar (maksimal 15 MB).");
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ----------------------------------------------------------------
     Process File with AI
  ---------------------------------------------------------------- */
  const handleSubmit = async () => {
    if (!selectedFile && !pastedText.trim()) {
      setError("Pilih file atau masukkan teks materi kuliah kamu terlebih dahulu ya.");
      return;
    }

    setLoading(true);
    setError(null);
    setPlanResult(null);
    setExplainResult(null);
    setSavedSuccess(false);

    try {
      const isSelectedPdf = selectedFile && (selectedFile.name.toLowerCase().endsWith(".pdf") || selectedFile.type.includes("pdf"));

      if (mode === "generate-plan") {
        setLoadingStep("abang ganteng sedang menyusun Study Plan adaptif kamu...");
        let res: Response;

        if (isSelectedPdf && selectedFile) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("days", String(days));
          res = await fetch("/api/study-materials/generate-plan", {
            method: "POST",
            body: formData,
          });
        } else {
          let extractedText = pastedText.trim();
          let fileBase64: string | undefined;
          let mimeType: string = "text/plain";

          if (selectedFile) {
            setLoadingStep("Memproses & mengekstrak file...");
            const formData = new FormData();
            formData.append("file", selectedFile);
            const parseRes = await fetch("/api/study-materials/parse", {
              method: "POST",
              body: formData,
            });
            const parseData = await parseRes.json();
            if (!parseRes.ok || !parseData.success) {
              throw new Error(parseData.error || "Gagal mengekstrak teks materi.");
            }
            extractedText = parseData.text;
            fileBase64 = parseData.fileBase64;
            mimeType = parseData.fileType || selectedFile.type || "text/plain";
          }

          res = await fetch("/api/study-materials/generate-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: extractedText,
              days: Number(days),
              fileBase64,
              mimeType,
            }),
          });
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Gagal membuat Study Plan.");
        }
        setPlanResult(data.result);
      } else {
        setLoadingStep("abang ganteng sedang menyederhanakan & merangkum materi...");
        let res: Response;

        if (isSelectedPdf && selectedFile) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("title", selectedFile.name);
          res = await fetch("/api/study-materials/explain", {
            method: "POST",
            body: formData,
          });
        } else {
          let extractedText = pastedText.trim();
          let fileBase64: string | undefined;
          let mimeType: string = "text/plain";

          if (selectedFile) {
            setLoadingStep("Memproses & mengekstrak file...");
            const formData = new FormData();
            formData.append("file", selectedFile);
            const parseRes = await fetch("/api/study-materials/parse", {
              method: "POST",
              body: formData,
            });
            const parseData = await parseRes.json();
            if (!parseRes.ok || !parseData.success) {
              throw new Error(parseData.error || "Gagal mengekstrak teks materi.");
            }
            extractedText = parseData.text;
            fileBase64 = parseData.fileBase64;
            mimeType = parseData.fileType || selectedFile.type || "text/plain";
          }

          res = await fetch("/api/study-materials/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: extractedText,
              title: selectedFile?.name || "Materi Kuliah",
              fileBase64,
              mimeType,
            }),
          });
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Gagal menyederhanakan materi.");
        }
        setExplainResult(data.result);
      }
    } catch (err: unknown) {
      console.error("Processing error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses materi. Coba lagi ya."
      );
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  /* ----------------------------------------------------------------
     Save Generated Plan to Firestore
  ---------------------------------------------------------------- */
  const handleSaveToFirestore = async () => {
    if (!planResult || !user?.uid) return;

    setSaving(true);
    try {
      await saveStudyPlan(user.uid, planResult);
      setSavedSuccess(true);
      if (onPlanSaved) onPlanSaved();
    } catch (err) {
      console.error("Save plan error:", err);
      setError("Gagal menyimpan plan ke Firestore. Cek koneksi kamu ya.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ================================================================
          Card Header & Mode Switcher
      ================================================================ */}
      <div className="bg-[#080C14]/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl flex flex-col gap-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Backlight Gradient */}
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="size-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] shrink-0">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
              Unggah Materi & Asisten AI
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unggah PDF, DOCX, atau catat materi kuliah untuk langsung dibuatkan Study Plan & Rangkuman Sederhana.
            </p>
          </div>
        </div>

        {/* Action Switcher Tabs ("Buat Study Plan" vs "Jelaskan Materi Ini") */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#030712]/90 border border-white/10 gap-1.5 text-xs relative z-10">
          <m.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setMode("generate-plan")}
            className={cn(
              "py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
              mode === "generate-plan"
                ? "bg-gradient-to-r from-cyan-500/20 via-cyan-500/15 to-blue-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] font-black"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <Calendar size={16} className={mode === "generate-plan" ? "text-cyan-400" : ""} />
            <span>Buat Study Plan</span>
          </m.button>
          <m.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setMode("explain")}
            className={cn(
              "py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
              mode === "explain"
                ? "bg-gradient-to-r from-violet-500/20 via-violet-500/15 to-cyan-500/20 text-violet-300 border border-violet-400/50 shadow-[0_0_20px_rgba(139,92,246,0.25)] font-black"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <BrainCircuit size={16} className={mode === "explain" ? "text-violet-400" : ""} />
            <span>Jelaskan Materi Ini</span>
          </m.button>
        </div>

        {/* Target Duration Selector Pills */}
        <AnimatePresence>
          {mode === "generate-plan" && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="overflow-hidden relative z-10"
            >
              <FieldGroup className="gap-2.5 pt-1">
                <FieldLabel>
                  <Clock size={14} className="text-cyan-400" /> Durasi Target Belajar:{" "}
                  <span className="text-white font-black">{days === 30 ? "1 Bulan" : `${days} Hari`}</span>
                </FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[3, 7, 14, 30].map((d) => {
                    const isActive = days === d;
                    return (
                      <m.button
                        key={d}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setDays(d)}
                        className={cn(
                          "py-3 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          isActive
                            ? "bg-cyan-500/10 border-cyan-400/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.02] font-black"
                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        )}
                      >
                        <span>{d === 7 ? "7 Hari (Standard)" : d === 30 ? "1 Bulan" : `${d} Hari`}</span>
                      </m.button>
                    );
                  })}
                </div>
              </FieldGroup>
            </m.div>
          )}
        </AnimatePresence>

        {/* Drag & Drop Cybernetic Upload Zone */}
        <m.div
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative rounded-3xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 backdrop-blur-xl relative z-10 overflow-hidden",
            dragActive
              ? "border-cyan-400 bg-cyan-500/15 shadow-[0_0_35px_rgba(6,182,212,0.35)] scale-[1.01]"
              : selectedFile
              ? "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "border-white/15 bg-[#030712]/60 hover:border-cyan-400/60 hover:bg-[#080C14]/90 shadow-2xl hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center gap-3.5 bg-slate-950/90 p-3.5 rounded-2xl border border-emerald-500/40 w-full max-w-md justify-between shadow-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <FileText size={20} />
                </div>
                <div className="text-left truncate">
                  <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="size-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Hapus file"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="size-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                <UploadCloud size={28} className="animate-bounce text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Tarik & lepas file di sini, atau <span className="text-cyan-300 font-extrabold hover:underline">pilih file dari perangkat</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Mendukung file PDF, DOCX, TXT, atau Markdown (Maksimal 15MB)
                </p>
              </div>
            </div>
          )}
        </m.div>

        {/* Direct Text Input Area with Field & FieldGroup */}
        <FieldGroup className="relative z-10">
          <Field>
            <FieldLabel htmlFor="pasted-text-input">
              Atau Tempel Teks Catatan Kuliah Kamu Directly
            </FieldLabel>
            <textarea
              id="pasted-text-input"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Ketik atau tempel rangkuman materi dosen di sini..."
              rows={3}
              className="w-full rounded-2xl bg-[#030712]/60 border border-white/10 px-4 py-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all resize-none font-sans"
            />
            <FieldDescription>
              Teks catatan ini akan dianalisis oleh abang ganteng untuk menyusun jadwal belajar atau penjelasan ringkas.
            </FieldDescription>
          </Field>
        </FieldGroup>

        {/* Error Alert */}
        {error && (
          <FieldError className="relative z-10">
            <span>⚠️ {error}</span>
          </FieldError>
        )}

        {/* Submit Action Button */}
        <m.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleSubmit}
          disabled={loading || (!selectedFile && !pastedText.trim())}
          className={cn(
            "py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all relative z-10 active:scale-95",
            mode === "generate-plan"
              ? "bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
              : "bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white"
          )}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {loadingStep || "Memproses..."}
            </>
          ) : (
            <>
              <Sparkles size={16} />{" "}
              {mode === "generate-plan" ? "Proses & Buat Study Plan 🚀" : "Proses & Jelaskan Materi 💡"}
            </>
          )}
        </m.button>
      </div>

      {/* ================================================================
          Result View A: Generated Study Plan
      ================================================================ */}
      {planResult && (
        <m.div
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="bg-[#080C14]/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl flex flex-col gap-6 border border-cyan-500/30 shadow-2xl"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                Study Plan AI Hasil Generasi
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-black text-white mt-2">
                {planResult.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mata Kuliah: <span className="text-cyan-300 font-bold">{planResult.subject}</span> · Durasi: {planResult.durationDays || 7} Hari
              </p>
            </div>

            {/* Save Button */}
            <m.button
              type="button"
              onClick={handleSaveToFirestore}
              disabled={saving || savedSuccess}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95",
                savedSuccess
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white hover:from-cyan-300 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              )}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Menyimpan...
                </>
              ) : savedSuccess ? (
                <>
                  <Check size={14} /> Tersimpan di Plan Board!
                </>
              ) : (
                <>
                  <Save size={14} /> Simpan ke Study Plan 📌
                </>
              )}
            </m.button>
          </div>

          {/* Tasks List */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Daftar Tugas Harian ({planResult.tasks?.length || 0} Tugas)
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {(planResult.tasks || []).map((tk, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#030712]/60 border border-white/10 text-xs hover:border-cyan-500/30 transition-colors"
                >
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-extrabold text-[11px] shrink-0">
                    Hari ke-{tk.day}
                  </span>
                  <span className="font-bold text-slate-200 flex-1">{tk.title}</span>
                </div>
              ))}
            </div>
          </div>
        </m.div>
      )}

      {/* ================================================================
          Result View B: Material Explanation
      ================================================================ */}
      {explainResult && (
        <m.div
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="bg-[#080C14]/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl flex flex-col gap-6 border border-violet-500/30 shadow-2xl"
        >
          {/* Header */}
          <div className="pb-4 border-b border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
              Penjelasan Sederhana (Feynman Style)
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-black text-white mt-2">
              {explainResult.title}
            </h3>
          </div>

          {/* Key Summary Callout */}
          <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs leading-relaxed flex items-start gap-3.5 shadow-md">
            <BookOpen size={20} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-extrabold block text-cyan-300 mb-1 text-xs">Ringkasan Utama:</span>
              <StructuredMarkdown content={explainResult.keySummary} />
            </div>
          </div>

          {/* Important Concepts Grid */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Konsep Penting & Analogi Sehari-hari
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {explainResult.importantConcepts.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#030712]/60 border border-white/10 p-4.5 flex flex-col gap-2 hover:border-cyan-500/30 transition-colors"
                >
                  <span className="text-xs font-black text-cyan-300">{item.concept}</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.simpleExplanation}</p>
                  <div className="mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    💡 <strong className="text-slate-200 font-bold">Contoh:</strong> {item.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simplified Breakdown */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Penjelasan Lengkap & Konsep Rumit yang Disederhanakan
            </h4>
            <div className="p-6 rounded-2xl bg-[#030712]/90 border border-white/10 text-xs leading-relaxed text-slate-200 space-y-3 font-sans h-auto max-h-[650px] overflow-y-auto custom-scrollbar shadow-inner">
              <StructuredMarkdown content={explainResult.simplifiedBreakdown} />
            </div>
          </div>

          {/* Interactive Review Questions Accordion */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-cyan-400" /> Pertanyaan Review Diri (3-5 Soal)
            </h4>

            <div className="flex flex-col gap-2">
              {explainResult.reviewQuestions.map((rq, idx) => {
                const isOpen = openQuestionIdx === idx;
                const showHint = !!showHints[idx];

                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#030712]/70 border border-white/10 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenQuestionIdx(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {rq.question}
                      </span>
                      {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <m.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 pb-4 pt-1 border-t border-white/5 flex flex-col gap-3 text-xs"
                        >
                          {/* Answer */}
                          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                            <strong className="block text-emerald-400 mb-0.5">Jawaban Benar:</strong>
                            {rq.answer}
                          </div>

                          {/* Hint Toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              setShowHints((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className="text-[11px] text-cyan-300 hover:underline text-left self-start flex items-center gap-1 cursor-pointer font-bold"
                          >
                            💡 {showHint ? "Sembunyikan Petunjuk" : "Lihat Petunjuk (Hint)"}
                          </button>

                          {showHint && (
                            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px]">
                              {rq.hint}
                            </div>
                          )}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </m.div>
      )}
    </div>
  );
}
