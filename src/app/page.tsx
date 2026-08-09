"use client";

import { m, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  BookOpen,
  ChevronRight,
  Shield,
  ExternalLink,
  FileText,
  Swords,
  Video,
  CheckSquare,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { gsap, ScrollTrigger, EMIL_SPRING_TRANSITION } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/* ---------------------------------------------------------------
   Animation Variants & Easings (Emil Kowalski Design Principles)
--------------------------------------------------------------- */
const EASE_EMIL_OUT_ARR: [number, number, number, number] = [0.23, 1, 0.32, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_EMIL_OUT_ARR },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE_EMIL_OUT_ARR },
  },
};

/* ---------------------------------------------------------------
   Feature Bento Grid Data
--------------------------------------------------------------- */
const coreFeatures = [
  {
    id: "feature-pdf-plan",
    Icon: FileText,
    label: "Rencana Belajar AI & Ekstraksi PDF",
    description:
      "Unggah materi kuliah atau slide PDF kamu, otomatis dibuatkan Study Plan adaptif dan rangkuman santai oleh abang ganteng.",
    badgeText: "PDF & Slide Sync",
    accent: "rgba(6, 182, 212, 0.14)",
    accentBorder: "rgba(6, 182, 212, 0.3)",
    spanCols: "lg:col-span-2",
  },
  {
    id: "feature-feynman-boss",
    Icon: Swords,
    label: "Feynman Boss Fight & Duel 1v1",
    description:
      "Uji pemahaman materi kamu lewat battle game interaktif, fitur countdown timer, dan pesan taunt real-time ('kenak mental', 'mantap jiwa').",
    badgeText: "Boss Battle Game",
    accent: "rgba(139, 92, 246, 0.14)",
    accentBorder: "rgba(139, 92, 246, 0.3)",
    spanCols: "lg:col-span-2",
  },
  {
    id: "feature-ai-tutor",
    Icon: BrainCircuit,
    label: "AI Tutor Adaptif (Setup Wizard)",
    description:
      "Asisten belajar personal bersama abang ganteng yang otomatis menyesuaikan kedalaman penjelasan khusus untuk jenjang SMA maupun Kuliah.",
    badgeText: "Versi abang ganteng",
    accent: "rgba(56, 189, 248, 0.14)",
    accentBorder: "rgba(56, 189, 248, 0.3)",
    spanCols: "lg:col-span-2",
  },
  {
    id: "feature-study-meet",
    Icon: Video,
    label: "Collaborative Study Meet",
    description:
      "Ruang belajar real-time buat mabar bareng teman, berbagi catatan live, dan panggil penjelasan abang ganteng bersama.",
    badgeText: "Real-time Mabar",
    accent: "rgba(168, 85, 247, 0.14)",
    accentBorder: "rgba(168, 85, 247, 0.3)",
    spanCols: "lg:col-span-1",
  },
  {
    id: "feature-daily-tasks",
    Icon: CheckSquare,
    label: "Tugas Prioritas Hari Ini",
    description:
      "Dashboard terintegrasi yang otomatis mensinkronkan target harian kamu dari Study Plan aktif secara konsisten.",
    badgeText: "Auto Sync Target",
    accent: "rgba(16, 185, 129, 0.14)",
    accentBorder: "rgba(16, 185, 129, 0.3)",
    spanCols: "lg:col-span-1",
  },
];

/* ---------------------------------------------------------------
   Process Steps Data
--------------------------------------------------------------- */
const processSteps = [
  {
    step: "01",
    Icon: BookOpen,
    title: "Petakan Kurikulum Kamu",
    detail:
      "Unggah silabus, jadwal ujian, dan target belajar kamu. AI akan membuatkan graf pengetahuan lengkap dari materi kamu.",
  },
  {
    step: "02",
    Icon: Zap,
    title: "Dapatkan Plan Presisi Kamu",
    detail:
      "StudySync AI membuatkan jadwal harian, membagi waktu berdasarkan bobot subjek, tenggat waktu, dan jam fokus terbaik kamu.",
  },
  {
    step: "03",
    Icon: Shield,
    title: "Belajar Bersama AI Co-Pilot",
    detail:
      "Abang ganteng hadir di setiap sesi belajar untuk menjawab pertanyaan, menguji pemahaman, dan terus menyempurnakan plan kamu.",
  },
];

/* ---------------------------------------------------------------
   Animated SVG Progress Indicators for Bento Stats
--------------------------------------------------------------- */
function CircularProgressSvg() {
  return (
    <svg className="size-14 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="18" className="stroke-slate-800" strokeWidth="4" fill="none" />
      <m.circle
        cx="24"
        cy="24"
        r="18"
        className="stroke-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
        strokeWidth="4"
        fill="none"
        strokeDasharray={113.1}
        initial={{ strokeDashoffset: 113.1 }}
        whileInView={{ strokeDashoffset: 6.78 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeedometerGaugeSvg() {
  return (
    <svg className="size-14" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M 8 34 A 18 18 0 1 1 40 34" className="stroke-slate-800" strokeWidth="4" fill="none" strokeLinecap="round" />
      <m.path
        d="M 8 34 A 18 18 0 1 1 40 34"
        className="stroke-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
        strokeWidth="4"
        fill="none"
        strokeDasharray={84.8}
        initial={{ strokeDashoffset: 84.8 }}
        whileInView={{ strokeDashoffset: 10 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        strokeLinecap="round"
      />
      <line x1="24" y1="24" x2="34" y2="16" className="stroke-white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function WaveformPulseSvg() {
  return (
    <svg className="size-14" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M 4 24 L 14 24 L 19 12 L 25 36 L 31 20 L 36 24 L 44 24" className="stroke-slate-800" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <m.path
        d="M 4 24 L 14 24 L 19 12 L 25 36 L 31 20 L 36 24 L 44 24"
        className="stroke-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
        strokeWidth="3"
        fill="none"
        strokeDasharray={100}
        initial={{ strokeDashoffset: 100 }}
        whileInView={{ strokeDashoffset: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparklineTrendSvg() {
  return (
    <svg className="size-14" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M 6 38 L 16 30 L 26 34 L 42 10" className="stroke-slate-800" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <m.path
        d="M 6 38 L 16 30 L 26 34 L 42 10"
        className="stroke-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
        strokeWidth="3"
        fill="none"
        strokeDasharray={60}
        initial={{ strokeDashoffset: 60 }}
        whileInView={{ strokeDashoffset: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="10" r="3.5" className="fill-cyan-300 animate-pulse" />
    </svg>
  );
}

/* ---------------------------------------------------------------
   Hero Section with GSAP Scroll-Triggered Parallax & Scale
--------------------------------------------------------------- */
function HeroSection() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // GSAP ScrollTrigger scale-down dynamics on scroll
  useEffect(() => {
    if (typeof window === "undefined" || prefersReduced || !heroWrapperRef.current || !heroContentRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(heroContentRef.current, {
        scale: 0.93,
        opacity: 0.35,
        y: 40,
        ease: "none",
        scrollTrigger: {
          trigger: heroWrapperRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, heroWrapperRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  const handleStartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      router.push("/dashboard");
    } else {
      try {
        await signInWithGoogle();
        router.push("/dashboard");
      } catch {
        router.push("/dashboard");
      }
    }
  };

  return (
    <section
      ref={heroWrapperRef}
      className="relative flex flex-col items-center justify-center min-h-[92dvh] px-6 pt-28 pb-16 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Ambient Electric Glow Backdrops */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.16) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[480px] rounded-full border border-cyan-500/20 shadow-[0_0_100px_rgba(6,182,212,0.08)_inset]"
        />
      </div>

      <div ref={heroContentRef} className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full gap-8">
        <m.div
          className="flex flex-col items-center text-center max-w-4xl w-full gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Competition Badge: Cybernetic Pill with Glowing Border & Pulsing Dot */}
          <m.div variants={staggerItem}>
            <span
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.4)]"
              id="hero-badge"
              aria-label="BITSMIKRO INNOVATIVE VIBECODE"
            >
              <span className="size-2 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
              <span>BITSMIKRO INNOVATIVE VIBECODE — Phase 1 Demo</span>
            </span>
          </m.div>

          {/* Header Title: Space Grotesk display with gradient clipping */}
          <m.div variants={staggerItem} className="space-y-3">
            <h1
              id="hero-heading"
              className="font-display text-5xl sm:text-7xl lg:text-[5.75rem] font-extrabold tracking-tight leading-[1.03]"
            >
              <span className="text-white">
                Engine Belajar
              </span>
              <br />
              <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.3)]">
                Presisi Cerdas
              </span>
              <br />
              <span className="text-slate-300 font-bold">
                Untuk Hasil Terbaik.
              </span>
            </h1>
          </m.div>

          {/* Subheading with casual Indonesian AI Tutor reference */}
          <m.p
            className="text-base sm:text-xl leading-relaxed max-w-2xl text-slate-300 font-normal"
            variants={staggerItem}
          >
            StudySync AI menyusun study plan adaptif yang dirancang presisi sesuai
            pola kognitif, jadwal ujian, dan tingkat penguasaan materi kamu — lalu
            diperbarui terus-menerus lewat analisis performa bersama abang ganteng.
          </m.p>

          {/* Primary CTA Buttons with Tactile scale(0.97) Press Dynamics */}
          <m.div
            className="flex flex-col sm:flex-row items-center gap-4"
            variants={staggerItem}
          >
            <m.div
              whileHover={prefersReduced ? {} : { scale: 1.03, y: -2 }}
              whileTap={prefersReduced ? {} : { scale: 0.97, y: 1 }}
              transition={EMIL_SPRING_TRANSITION}
            >
              <Link
                href="/dashboard"
                onClick={handleStartClick}
                id="cta-get-started"
                className="btn-primary text-[15px] px-9 py-4 font-bold rounded-2xl flex items-center gap-2 text-white shadow-[0_0_30px_rgba(6,182,212,0.35)] cursor-pointer"
                aria-label="Mulai StudySync AI — buat study plan kamu"
              >
                <span>Mulai StudySync AI</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </m.div>

            <m.div
              whileHover={prefersReduced ? {} : { scale: 1.02 }}
              whileTap={prefersReduced ? {} : { scale: 0.97 }}
              transition={EMIL_SPRING_TRANSITION}
            >
              <Link
                href="#features"
                id="cta-how-it-works"
                className="btn-ghost text-[15px] px-8 py-4 font-semibold rounded-2xl flex items-center gap-2 border border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-200 cursor-pointer shadow-lg"
                aria-label="Pelajari cara kerja StudySync AI"
              >
                <span>Lihat Fitur</span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </m.div>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Bento Feature Card Component with Radial Mouse Spotlight
--------------------------------------------------------------- */
function BentoFeatureCard({
  id,
  Icon,
  label,
  description,
  badgeText,
  accent,
  spanCols = "lg:col-span-1",
}: {
  id: string;
  Icon: React.ElementType;
  label: string;
  description: string;
  badgeText?: string;
  accent: string;
  spanCols?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <m.article
      ref={cardRef}
      id={id}
      variants={staggerItem}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={prefersReduced ? {} : { y: -6, scale: 1.015 }}
      transition={EMIL_SPRING_TRANSITION}
      className={cn(
        "group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl overflow-hidden",
        "bg-slate-900/65 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 shadow-2xl transition-all duration-300",
        spanCols
      )}
      aria-label={label}
    >
      {/* Top Gloss Sheen */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none z-10" />

      {/* Mouse-Tracking Radial Spotlight Glow */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.16), rgba(139, 92, 246, 0.1), transparent 80%)`,
        }}
      />

      {/* Ambient background glow */}
      <div
        className="absolute -top-24 -right-24 size-48 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
        style={{ background: accent }}
      />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div
            className="size-12 rounded-2xl flex items-center justify-center border border-cyan-500/30 bg-cyan-950/70 text-cyan-300 shadow-md group-hover:scale-110 group-hover:border-cyan-400 transition-all duration-300"
            aria-hidden="true"
          >
            <Icon className="size-6 text-cyan-400" strokeWidth={1.75} />
          </div>

          {badgeText && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm">
              {badgeText}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
            {label}
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">
            {description}
          </p>
        </div>
      </div>

      <div
        className="mt-6 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-2 relative z-10"
        aria-hidden="true"
      >
        <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">
          Jelajahi Fitur
        </span>
        <ChevronRight size={14} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </m.article>
  );
}

/* ---------------------------------------------------------------
   Bento Stat Card with SVG Animated Indicators
--------------------------------------------------------------- */
function BentoStatCard({
  value,
  label,
  sublabel,
  SvgIndicator,
}: {
  value: string;
  label: string;
  sublabel: string;
  SvgIndicator: React.FC;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <m.div
      ref={cardRef}
      variants={staggerItem}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={prefersReduced ? {} : { y: -4, scale: 1.02 }}
      transition={EMIL_SPRING_TRANSITION}
      className={cn(
        "group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl overflow-hidden",
        "bg-slate-900/70 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 shadow-2xl transition-all duration-300"
      )}
      role="listitem"
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none z-10" />

      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.16), rgba(139, 92, 246, 0.1), transparent 80%)`,
        }}
      />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <span className="text-[11px] font-bold tracking-widest uppercase text-cyan-400">
          {sublabel}
        </span>
        <div className="flex-shrink-0">
          <SvgIndicator />
        </div>
      </div>

      <div className="mt-4 space-y-1 relative z-10">
        <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          {value}
        </span>
        <p className="text-xs sm:text-sm font-semibold text-slate-300">
          {label}
        </p>
      </div>
    </m.div>
  );
}

/* ---------------------------------------------------------------
   Features & Stats Section (Spacious 4-Column Bento Grid)
--------------------------------------------------------------- */
function FeatureGrid() {
  return (
    <section
      id="features"
      className="relative px-6 py-24 max-w-7xl mx-auto w-full"
      aria-labelledby="features-heading"
    >
      <m.div
        className="text-center mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <span className="badge-cyan mb-4 inline-flex" aria-label="Fitur Utama">
          Fitur Utama & Performa
        </span>
        <h2
          id="features-heading"
          className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white"
        >
          Setiap fitur dirancang untuk{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            presisi akademis
          </span>
        </h2>
        <p className="text-base max-w-xl mx-auto leading-relaxed text-slate-300">
          Bukan sekadar aplikasi to-do biasa. StudySync AI adalah platform
          performa kognitif adaptif bersama abang ganteng.
        </p>
      </m.div>

      {/* 4-Column Feature Bento Grid */}
      <m.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {coreFeatures.map(({ id, Icon, label, description, badgeText, accent, spanCols }) => (
          <BentoFeatureCard
            key={id}
            id={id}
            Icon={Icon}
            label={label}
            description={description}
            badgeText={badgeText}
            accent={accent}
            spanCols={spanCols}
          />
        ))}
      </m.div>

      {/* 4-Column Bento Stats Strip with SVG Indicators */}
      <m.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        role="list"
        aria-label="Statistik Performa Utama"
      >
        <BentoStatCard
          value="94%"
          label="Peningkatan Daya Ingat"
          sublabel="Akurasi Kognitif"
          SvgIndicator={CircularProgressSvg}
        />
        <BentoStatCard
          value="3.2x"
          label="Efisiensi Belajar"
          sublabel="Kecepatan Pemahaman"
          SvgIndicator={SpeedometerGaugeSvg}
        />
        <BentoStatCard
          value="< 48h"
          label="Rekalibrasi Adaptif"
          sublabel="Update Plan Otomatis"
          SvgIndicator={WaveformPulseSvg}
        />
        <BentoStatCard
          value="A+"
          label="Trajektori Nilai"
          sublabel="Target Akademis"
          SvgIndicator={SparklineTrendSvg}
        />
      </m.div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Workflow & How-It-Works Step Card
--------------------------------------------------------------- */
function StepCard({
  step,
  Icon,
  title,
  detail,
  index,
  isLast,
}: {
  step: string;
  Icon: React.ElementType;
  title: string;
  detail: string;
  index: number;
  isLast: boolean;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <m.div
      variants={staggerItem}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      whileHover={prefersReduced ? {} : { scale: 1.015, y: -2 }}
      transition={EMIL_SPRING_TRANSITION}
      className={cn(
        "group relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-7 sm:p-8 rounded-3xl",
        "bg-slate-900/60 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl",
        "hover:border-cyan-500/40 hover:bg-slate-900/80 transition-colors duration-300"
      )}
    >
      {/* Left accent indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 via-sky-400 to-violet-500 opacity-60 group-hover:opacity-100 group-hover:w-2 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]" />

      {/* Step number + Icon */}
      <div className="flex items-center gap-4 flex-shrink-0 z-10 pl-2 sm:pl-0">
        <span className="font-display text-sm font-extrabold tracking-widest text-cyan-400 uppercase">
          {step}
        </span>
        <div
          className="size-12 rounded-2xl flex items-center justify-center bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 shadow-lg group-hover:scale-110 group-hover:border-cyan-400 transition-all duration-300"
          aria-hidden="true"
        >
          <Icon className="size-6 text-cyan-400" strokeWidth={1.75} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1.5 z-10 pl-2 sm:pl-0">
        <h3 className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-300">
          {detail}
        </p>
      </div>

      {!isLast && (
        <ChevronRight
          className="hidden sm:block flex-shrink-0 size-6 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all z-10"
          aria-hidden="true"
        />
      )}
    </m.div>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative px-6 py-24 max-w-5xl mx-auto w-full"
      aria-labelledby="how-it-works-heading"
    >
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24" aria-hidden="true" />

      <m.div
        className="text-center mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <span className="badge-cyan mb-4 inline-flex" aria-label="Cara kerja">
          Cara Kerja
        </span>
        <h2
          id="how-it-works-heading"
          className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white"
        >
          Tiga Langkah Menuju{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            Puncak Performa
          </span>
        </h2>
        <p className="text-base max-w-xl mx-auto leading-relaxed text-slate-300">
          Dari kekacauan materi hingga penguasaan terstruktur secara otomatis.
        </p>
      </m.div>

      {/* Interactive Glass Step Cards */}
      <div className="space-y-6">
        {processSteps.map(({ step, Icon, title, detail }, index) => (
          <StepCard
            key={step}
            step={step}
            Icon={Icon}
            title={title}
            detail={detail}
            index={index}
            isLast={index === processSteps.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Team Data & Obsidian Glass Member Card
--------------------------------------------------------------- */
const teamMembers = [
  {
    name: "MUH.D.FIRDAUS",
    role: "Full-Stack Dev",
    handle: "@_daffafirdaus0",
    instagram: "https://www.instagram.com/_daffafirdaus0?igsh=MTMwdjI5OXhuY2hyMQ==",
    imageSrc: "/team/muh.d.firdaus.jpeg",
    bio: "tidak dapat bicara,mutualan ig saja,sekalian bantu orang kecil ini mencapai 1000 follower pertamanya",
    accentGlow: "rgba(6, 182, 212, 0.3)",
    roleBadgeStyle: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  },
  {
    name: "RIO ARRASYID H",
    role: "Frontend Dev",
    handle: "@riorasyidd",
    instagram: "https://www.instagram.com/riorasyidd?igsh=MWgyYmN6NWhiag==",
    imageSrc: "/team/rio_arrasyid_h.jpeg",
    bio: "tidak ada yang diberi, semua harus diraih",
    accentGlow: "rgba(56, 189, 248, 0.3)",
    roleBadgeStyle: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  },
  {
    name: "ARIEF RACHMAN",
    role: "Backend Dev",
    handle: "@arippyon",
    instagram: "https://www.instagram.com/arippyon?igsh=MXYwaGNlZ29mNngxdw==",
    imageSrc: "/team/arief_rachman.jpeg",
    bio: "Kasih banjir bang",
    accentGlow: "rgba(139, 92, 246, 0.3)",
    roleBadgeStyle: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  },
];

function InstagramIcon({ className = "size-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TeamMemberCard({
  member,
  index,
}: {
  member: (typeof teamMembers)[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <m.article
      ref={cardRef}
      variants={staggerItem}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={prefersReduced ? {} : { y: -6, scale: 1.015 }}
      transition={EMIL_SPRING_TRANSITION}
      className={cn(
        "group relative flex flex-col items-center text-center p-8 rounded-3xl overflow-hidden",
        "bg-slate-900/65 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 shadow-2xl transition-all duration-300"
      )}
    >
      {/* Top Gloss Highlight Sheen */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none z-10" />

      {/* Mouse-Tracking Spotlight */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.18), rgba(139, 92, 246, 0.12), transparent 80%)`,
        }}
      />

      {/* Floating 3D Avatar Profile Frame */}
      <m.div
        className="relative mb-6 z-10"
        animate={prefersReduced ? {} : { y: [0, -6, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.4,
        }}
      >
        <div className="p-1 rounded-full bg-gradient-to-br from-cyan-400/50 via-white/10 to-violet-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300">
          <div className="relative size-24 rounded-full overflow-hidden flex items-center justify-center bg-slate-950 border border-white/20">
            <img
              src={member.imageSrc}
              alt={`Foto ${member.name}`}
              className="size-24 rounded-full object-cover p-0.5 group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </div>

        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950 border border-cyan-500/40 text-cyan-300 shadow-md">
          Core Dev
        </div>
      </m.div>

      {/* Details */}
      <div className="space-y-2 mb-6 flex-1 flex flex-col items-center z-10">
        <h3 className="font-display text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors uppercase">
          {member.name}
        </h3>

        <div className={cn("inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", member.roleBadgeStyle)}>
          {member.role}
        </div>

        <p className="text-xs sm:text-sm leading-relaxed max-w-xs mt-3 text-slate-300">
          {member.bio}
        </p>
      </div>

      {/* Instagram Button */}
      <a
        href={member.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-violet-600 hover:from-cyan-500 hover:via-sky-500 hover:to-violet-500 shadow-lg active:scale-[0.97] border border-white/20 transition-all duration-200 group/btn z-10"
        aria-label={`Kunjungi profil Instagram ${member.name}`}
      >
        <InstagramIcon className="size-4 text-white group-hover/btn:rotate-6 transition-transform" />
        <span>{member.handle}</span>
        <ExternalLink
          size={13}
          className="text-white/80 opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all"
        />
      </a>
    </m.article>
  );
}

function AboutUsSection() {
  return (
    <section
      id="about-us"
      className="relative px-6 py-24 max-w-7xl mx-auto w-full"
      aria-labelledby="about-heading"
    >
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-20" aria-hidden="true" />

      <m.div
        className="text-center mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <span className="badge-cyan mb-4 inline-flex" aria-label="Kenalan Yuk">
          KENALAN YUK
        </span>
        <h2
          id="about-heading"
          className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white"
        >
          Nama Tim Kami{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            Doa Ibu Mama Bapak Papa
          </span>
        </h2>
        <p className="text-base max-w-xl mx-auto leading-relaxed text-slate-300">
          kalo kepo ama kita langsung aje follow ig,haha
        </p>
      </m.div>

      {/* 3-Column Team Grid */}
      <m.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {teamMembers.map((member, index) => (
          <TeamMemberCard key={member.name} member={member} index={index} />
        ))}
      </m.div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Final CTA Section
--------------------------------------------------------------- */
function CtaSection() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleStartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      router.push("/dashboard");
    } else {
      try {
        await signInWithGoogle();
        router.push("/dashboard");
      } catch {
        router.push("/dashboard");
      }
    }
  };

  return (
    <section
      className="relative px-6 py-24 max-w-4xl mx-auto w-full text-center"
      aria-labelledby="cta-section-heading"
    >
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24" aria-hidden="true" />

      <m.div
        className="glass-panel rounded-3xl p-10 sm:p-16 relative overflow-hidden border border-white/15 bg-slate-900/80 shadow-2xl"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[450px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)",
            filter: "blur(40px)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <span className="badge-cyan" aria-label="Available now">
            Available Now — Phase 1
          </span>

          <h2
            id="cta-section-heading"
            className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white"
          >
            Mulai semester paling produktif
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
              kamu sekarang.
            </span>
          </h2>

          <p className="text-base max-w-md leading-relaxed text-slate-300">
            Gabung dalam demo dan rasakan pengalaman perencanaan belajar adaptif
            berbasis AI bersama abang ganteng yang dirancang untuk keunggulan akademis kamu.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <m.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97, y: 1 }}
              transition={EMIL_SPRING_TRANSITION}
            >
              <Link
                href="/dashboard"
                onClick={handleStartClick}
                id="cta-section-get-started"
                className="btn-primary text-[15px] px-9 py-4 font-bold rounded-2xl flex items-center gap-2 text-white shadow-2xl cursor-pointer"
                aria-label="Mulai StudySync AI sekarang"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </m.div>

            <Link
              href="#features"
              id="cta-section-features"
              className="btn-ghost text-[14px] px-8 py-4 font-semibold rounded-2xl flex items-center gap-2 border border-white/10 bg-slate-900/60 text-slate-200 cursor-pointer shadow-md"
              aria-label="Lihat semua fitur"
            >
              Lihat Semua Fitur
            </Link>
          </div>

          <div
            className="flex items-center gap-6 pt-2"
            role="list"
            aria-label="Indikator keunggulan"
          >
            {[
              { Icon: Shield, text: "Privasi Utama" },
              { Icon: Zap, text: "Adaptasi Real-Time" },
              { Icon: BrainCircuit, text: "Didukung abang ganteng" },
            ].map(({ Icon, text }) => (
              <div
                key={text}
                role="listitem"
                className="flex items-center gap-1.5 text-slate-400"
              >
                <Icon size={13} className="text-cyan-400" aria-hidden="true" />
                <span className="text-[11px] font-semibold text-slate-300">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </m.div>

      <div className="h-12" aria-hidden="true" />
    </section>
  );
}

/* ---------------------------------------------------------------
   Footer Section
--------------------------------------------------------------- */
function FooterSection() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/90 backdrop-blur-2xl py-12 px-6 mt-12 text-center text-xs text-slate-400 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-display text-lg font-bold text-white tracking-tight">
            StudySync<span className="text-cyan-400">-AI</span>
          </span>
          <p className="text-slate-400 text-xs">
            Platform Belajar Adaptif Berbasis AI
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="#features" className="hover:text-cyan-400 transition-colors">
            Fitur
          </Link>
          <Link href="#how-it-works" className="hover:text-cyan-400 transition-colors">
            Cara Kerja
          </Link>
          <Link href="#about-us" className="hover:text-cyan-400 transition-colors">
            Tim Kami
          </Link>
          <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
            Dashboard
          </Link>
        </div>

        <p className="text-slate-500 text-xs">
          © {new Date().getFullYear()} StudySync-AI. Dibuat dengan sepenuh hati oleh Tim StudySync-AI & abang ganteng.
        </p>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------
   Page Root
--------------------------------------------------------------- */
export default function HomePage() {
  return (
    <div className="flex flex-col items-center w-full">
      <HeroSection />
      <FeatureGrid />
      <HowItWorksSection />
      <CtaSection />
      <AboutUsSection />
      <FooterSection />
    </div>
  );
}
