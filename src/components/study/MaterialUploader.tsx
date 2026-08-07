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
  CheckCircle2,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  Check,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { saveStudyPlan } from "@/lib/firebase/db";
import type {
  GeneratedStudyPlanResponse,
  MaterialExplanationResponse,
} from "@/lib/ai/study-materials";

type Mode = "generate-plan" | "explain";

interface MaterialUploaderProps {
  onPlanSaved?: () => void;
}

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

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
      let extractedText = pastedText.trim();
      let fileBase64: string | undefined = undefined;
      let mimeType: string = "text/plain";
      let isPdf: boolean = false;

      // Step 1: Parse file if file selected
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
        mimeType = parseData.fileType || selectedFile.type || "application/pdf";
        isPdf = parseData.isPdf || false;
      }

      // Step 2: Call AI endpoint
      if (mode === "generate-plan") {
        setLoadingStep("abang ganteng sedang menyusun Study Plan adaptif kamu...");
        const res = await fetch("/api/study-materials/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: extractedText,
            days: Number(days),
            fileBase64,
            mimeType,
            isPdf,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Gagal membuat Study Plan.");
        }
        setPlanResult(data.result);
      } else {
        setLoadingStep("abang ganteng sedang menyederhanakan & merangkum materi...");
        const res = await fetch("/api/study-materials/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: extractedText,
            title: selectedFile?.name || "Materi Kuliah",
            fileBase64,
            mimeType,
            isPdf,
          }),
        });

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
      await saveStudyPlan(user.uid, planResult.studyPlan);
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
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-50" style={{ fontFamily: "var(--font-outfit)" }}>
              Unggah Materi & Asisten AI
            </h2>
            <p className="text-xs text-slate-400">
              Unggah PDF, DOCX, atau catat materi kuliah untuk langsung dibuatkan Study Plan & Rangkuman Sederhana.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/80 border border-white/10 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("generate-plan")}
            className={`py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === "generate-plan"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar size={15} /> Buat Study Plan
          </button>
          <button
            type="button"
            onClick={() => setMode("explain")}
            className={`py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === "explain"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BrainCircuit size={15} /> Jelaskan Materi Ini
          </button>
        </div>

        {/* Target Duration Selector (For Study Plan Mode) */}
        <AnimatePresence>
          {mode === "generate-plan" && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 pt-1 overflow-hidden"
            >
              <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock size={13} /> Durasi Target Belajar: <span className="text-slate-100 font-extrabold">{days} Hari</span>
              </label>
              <div className="flex items-center gap-2">
                {[3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      days === d
                        ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {d === 7 ? "7 Hari (Standard)" : d === 30 ? "1 Bulan" : `${d} Hari`}
                  </button>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10"
              : selectedFile
              ? "border-emerald-500/40 bg-emerald-950/20"
              : "border-white/15 bg-slate-900/40 hover:border-white/30 hover:bg-slate-900/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-emerald-500/30 w-full max-w-md justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <FileText size={18} />
                </div>
                <div className="text-left truncate">
                  <p className="text-xs font-bold text-slate-100 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400">
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
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                aria-label="Hapus file"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  Tarik & lepas file di sini, atau <span className="text-amber-400 underline">cari file</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung file PDF, DOCX, TXT, atau Markdown (Maks 15MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Textarea Fallback Option */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Atau Tempel Teks Catatan Kuliah Kamu Directly
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Ketik atau tempel rangkuman materi dosen di sini..."
            rows={3}
            className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-400/60 transition-colors resize-none"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Submit Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || (!selectedFile && !pastedText.trim())}
          className="skeuo-btn py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          style={{
            background:
              mode === "generate-plan"
                ? "linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))"
                : "linear-gradient(135deg, #0891b2, #0e7490)",
            color: "#030b22",
          }}
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
        </button>
      </div>

      {/* ================================================================
          Result View A: Generated Study Plan
      ================================================================ */}
      {planResult && (
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="glass-panel p-6 rounded-3xl flex flex-col gap-6 border border-amber-500/30 shadow-2xl"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300">
                Study Plan AI Hasil Generasi
              </span>
              <h3
                className="text-xl font-bold text-slate-50 mt-2"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {planResult.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mata Kuliah: <span className="text-amber-300 font-semibold">{planResult.subject}</span> · Durasi: {planResult.totalDays} Hari
              </p>
            </div>

            {/* Save Button */}
            <m.button
              type="button"
              onClick={handleSaveToFirestore}
              disabled={saving || savedSuccess}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all ${
                savedSuccess
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500"
              }`}
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

          {/* AI Summary Banner */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/25 text-amber-200 text-xs leading-relaxed flex items-start gap-3">
            <BrainCircuit size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-amber-300 mb-0.5">Ringkasan AI:</span>
              {planResult.summary}
            </div>
          </div>

          {/* Daily Modules */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Modul Harian & Tugas Utama
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {planResult.modules.map((mod) => (
                <div
                  key={mod.dayNumber}
                  className="rounded-2xl bg-slate-900/60 border border-white/10 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 font-extrabold text-[11px]">
                        {mod.dateOffset}
                      </span>
                      <span className="text-xs font-bold text-slate-100">{mod.goal}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {mod.estimatedMinutes} menit
                    </span>
                  </div>

                  {/* Topic badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {mod.topics.map((tp) => (
                      <span
                        key={tp}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-300"
                      >
                        #{tp}
                      </span>
                    ))}
                  </div>

                  {/* Tasks */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    {mod.tasks.map((tk, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                      >
                        <CheckCircle2 size={15} className="text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold text-slate-200">{tk.title}</span>
                          <span className="text-[11px] text-slate-400 leading-normal">{tk.description}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                          {tk.estimatedMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="glass-panel p-6 rounded-3xl flex flex-col gap-6 border border-cyan-500/30 shadow-2xl"
        >
          {/* Header */}
          <div className="pb-4 border-b border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
              Penjelasan Sederhana (Feynman Style)
            </span>
            <h3
              className="text-xl font-bold text-slate-50 mt-2"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              {explainResult.title}
            </h3>
          </div>

          {/* Key Summary Callout */}
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs leading-relaxed flex items-start gap-3">
            <BookOpen size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-cyan-300 mb-0.5">Ringkasan Utama:</span>
              {explainResult.keySummary}
            </div>
          </div>

          {/* Important Concepts Grid */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Konsep Penting & Analogi Sehari-hari
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {explainResult.importantConcepts.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-slate-900/60 border border-white/10 p-4 flex flex-col gap-2"
                >
                  <span className="text-xs font-black text-cyan-300">{item.concept}</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.simpleExplanation}</p>
                  <div className="mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    💡 <strong className="text-slate-300">Contoh:</strong> {item.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simplified Breakdown (Markdown formatted) */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Penjelasan Lengkap
            </h4>
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 text-xs leading-relaxed text-slate-200 space-y-2 whitespace-pre-line font-sans">
              {explainResult.simplifiedBreakdown}
            </div>
          </div>

          {/* Interactive Review Questions Accordion */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-cyan-400" /> Pertanyaan Review Diri (3-5 Soal)
            </h4>

            <div className="flex flex-col gap-2">
              {explainResult.reviewQuestions.map((rq, idx) => {
                const isOpen = openQuestionIdx === idx;
                const showHint = !!showHints[idx];

                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenQuestionIdx(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-[10px] flex items-center justify-center shrink-0">
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
                          exit={{ height: 0, opacity: 0 }}
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
                            className="text-[11px] text-amber-400 hover:underline text-left self-start flex items-center gap-1 cursor-pointer"
                          >
                            💡 {showHint ? "Sembunyikan Petunjuk" : "Lihat Petunjuk (Hint)"}
                          </button>

                          {showHint && (
                            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/25 text-amber-200 text-[11px]">
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
