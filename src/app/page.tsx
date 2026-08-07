"use client";

import { m, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  TrendingUp,
  Zap,
  BookOpen,
  Target,
  BarChart3,
  ChevronRight,
  Shield,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

/* ---------------------------------------------------------------
   Animation Variants
--------------------------------------------------------------- */
const EASE_SMOOTH = [0.4, 0, 0.2, 1] as [number, number, number, number];

/** Static fade-up variant — pass a custom `transition` prop at the call site to vary delay. */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_SMOOTH },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_SMOOTH },
  },
};

/* ---------------------------------------------------------------
   Feature Grid Data
--------------------------------------------------------------- */
const coreFeatures = [
  {
    id: "feature-adaptive-planning",
    Icon: CalendarDays,
    label: "Penjadwalan Adaptif",
    description:
      "Blok belajar dinamis yang otomatis menyesuaikan dengan waktu luang, tingkat energi, dan kurva daya ingat kamu secara real-time.",
    accent: "rgba(245, 158, 11, 0.12)",
    accentBorder: "rgba(245, 158, 11, 0.22)",
    iconColor: "var(--color-gold-400)",
  },
  {
    id: "feature-ai-tutor",
    Icon: BrainCircuit,
    label: "Engine AI Tutor",
    description:
      "Diskusi interaktif berbasis Gemini yang membantu menemukan bagian materi yang belum paham melalui pertanyaan terarah.",
    accent: "rgba(56, 189, 248, 0.08)",
    accentBorder: "rgba(56, 189, 248, 0.18)",
    iconColor: "rgba(56, 189, 248, 0.9)",
  },
  {
    id: "feature-progress-telemetry",
    Icon: TrendingUp,
    label: "Telemetri Progres",
    description:
      "Metrik sesi belajar yang detail, interval pengulangan berjarak, dan pemodelan daya ingat yang diperbarui setiap kali kamu belajar.",
    accent: "rgba(34, 197, 94, 0.08)",
    accentBorder: "rgba(34, 197, 94, 0.18)",
    iconColor: "rgba(34, 197, 94, 0.9)",
  },
  {
    id: "feature-goal-targeting",
    Icon: Target,
    label: "Dekomposisi Target",
    description:
      "Peta target ujian yang dipecah jadi tugas-tugas kecil harian, memastikan semua topik berhasil kamu kuasai.",
    accent: "rgba(168, 85, 247, 0.08)",
    accentBorder: "rgba(168, 85, 247, 0.18)",
    iconColor: "rgba(168, 85, 247, 0.9)",
  },
  {
    id: "feature-analytics",
    Icon: BarChart3,
    label: "Analitik Belajar",
    description:
      "Skor prediksi kesiapan ujian, peta penguasaan tiap subjek, dan indeks beban kognitif mingguan.",
    accent: "rgba(239, 68, 68, 0.08)",
    accentBorder: "rgba(239, 68, 68, 0.18)",
    iconColor: "rgba(239, 68, 68, 0.85)",
  },
  {
    id: "feature-sessions",
    Icon: Clock,
    label: "Intelegensi Sesi",
    description:
      "Varian Pomodoro ilmiah yang dikalibrasi dengan profil fokus kamu. Penjadwalan ulang otomatis menjaga kamu tetap teratur.",
    accent: "rgba(245, 158, 11, 0.08)",
    accentBorder: "rgba(245, 158, 11, 0.16)",
    iconColor: "var(--color-gold-300)",
  },
];

/* ---------------------------------------------------------------
   Stats Strip Data
--------------------------------------------------------------- */
const stats = [
  { value: "94%", label: "Peningkatan Daya Ingat" },
  { value: "3.2x", label: "Efisiensi Belajar" },
  { value: "< 48h", label: "Rekalibrasi Adaptif" },
  { value: "A+", label: "Trajektori Nilai" },
];

/* ---------------------------------------------------------------
   Process Steps
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
      "AI Tutor hadir di setiap sesi belajar untuk menjawab pertanyaan, menguji pemahaman, dan terus menyempurnakan plan kamu.",
  },
];

/* ---------------------------------------------------------------
   Hero Section
--------------------------------------------------------------- */
function HeroSection() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const prefersReduced = useReducedMotion();

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
      ref={containerRef}
      className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 pt-20 pb-16 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Parallax accent ring */}
      {!prefersReduced && (
        <m.div
          className="absolute inset-0 pointer-events-none"
          style={{ y: parallaxY, opacity: heroOpacity }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.06) 0%, rgba(13,31,82,0.4) 40%, transparent 70%)",
              filter: "blur(1px)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              border: "1px solid rgba(245,158,11,0.08)",
              boxShadow: "0 0 80px rgba(245,158,11,0.04) inset",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full"
            style={{
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          />
        </m.div>
      )}

      <m.div
        className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full gap-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <m.div variants={staggerItem}>
          <span
            className="badge-gold"
            id="hero-badge"
            aria-label="Powered by Gemini AI"
          >
            <Zap
              size={10}
              strokeWidth={2.5}
              style={{ color: "var(--color-gold-300)" }}
              aria-hidden="true"
            />
            AI Innovation Challenge — Phase 1 Demo
          </span>
        </m.div>

        {/* Heading */}
        <m.div variants={staggerItem} className="space-y-3">
          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl lg:text-[5.25rem] font-bold tracking-[-0.03em] leading-[1.05]"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            <span style={{ color: "var(--color-silver-50)" }}>
              Engine Belajar
            </span>
            <br />
            <span
              className="text-gradient-gold"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Presisi Cerdas
            </span>
            <br />
            <span style={{ color: "var(--color-silver-200)" }}>
              Untuk Hasil Terbaik.
            </span>
          </h1>
        </m.div>

        {/* Subheading */}
        <m.p
          className="text-lg sm:text-xl leading-relaxed max-w-2xl"
          style={{ color: "var(--color-silver-300)" }}
          variants={staggerItem}
        >
          StudySync AI menyusun study plan adaptif yang dirancang presisi sesuai
          pola kognitif, jadwal ujian, dan tingkat penguasaan materi kamu — lalu
          diperbarui terus-menerus lewat analisis performa AI.
        </m.p>

        {/* CTA Buttons */}
        <m.div
          className="flex flex-col sm:flex-row items-center gap-3"
          variants={staggerItem}
        >
          <m.div
            whileHover={prefersReduced ? {} : { scale: 1.02, y: -2 }}
            whileTap={prefersReduced ? {} : { scale: 0.97, y: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Link
              href="/dashboard"
              onClick={handleStartClick}
              id="cta-get-started"
              className="btn-primary text-[15px] px-8 py-3.5"
              aria-label="Mulai StudySync AI — buat study plan kamu"
            >
              Mulai StudySync AI
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </m.div>

          <m.div
            whileHover={prefersReduced ? {} : { scale: 1.01 }}
            whileTap={prefersReduced ? {} : { scale: 0.98 }}
          >
            <Link
              href="#how-it-works"
              id="cta-how-it-works"
              className="btn-ghost text-[15px] px-7 py-3.5"
              aria-label="Pelajari cara kerja StudySync AI"
            >
              Cara Kerja
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
          </m.div>
        </m.div>

        {/* Stats strip */}
        <m.div
          className="w-full mt-4"
          variants={staggerItem}
          style={{ willChange: "opacity, transform" }}
        >
          <div
            className="glass-panel rounded-2xl px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6"
            role="list"
            aria-label="Key performance statistics"
          >
            {stats.map(({ value, label }) => (
              <div
                key={label}
                role="listitem"
                className="flex flex-col items-center gap-1 text-center"
              >
                <span
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-gold"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {value}
                </span>
                <span
                  className="text-[11px] font-medium tracking-widest uppercase"
                  style={{ color: "var(--color-silver-400)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </m.div>
      </m.div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Feature Grid Section
--------------------------------------------------------------- */
function FeatureGrid() {
  return (
    <section
      id="features"
      className="relative px-6 py-24 max-w-7xl mx-auto w-full"
      aria-labelledby="features-heading"
    >
      {/* Section header */}
      <m.div
        className="text-center mb-14"
        variants={fadeUp}
        custom={0}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <span
          className="badge-gold mb-4 inline-flex"
          aria-label="Fitur Utama"
        >
          Fitur Utama
        </span>
        <h2
          id="features-heading"
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          style={{
            fontFamily: "var(--font-outfit)",
            color: "var(--color-silver-50)",
          }}
        >
          Setiap fitur dirancang untuk{" "}
          <span className="text-gradient-gold">presisi akademis</span>
        </h2>
        <p
          className="text-base max-w-xl mx-auto leading-relaxed"
          style={{ color: "var(--color-silver-300)" }}
        >
          Bukan sekadar aplikasi to-do biasa. StudySync AI adalah platform
          performa kognitif yang dibangun khusus untuk pelajar yang serius.
        </p>
      </m.div>

      {/* Feature grid */}
      <m.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {coreFeatures.map(({ id, Icon, label, description, accent, accentBorder, iconColor }) => (
          <m.article
            key={id}
            id={id}
            className="card-glass p-6 flex flex-col gap-4 group cursor-default"
            variants={staggerItem}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            aria-label={label}
          >
            {/* Icon container with skeuomorphic depth */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: accent,
                border: `1px solid ${accentBorder}`,
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.08) inset, 0 2px 6px rgba(0,0,0,0.35)",
              }}
              aria-hidden="true"
            >
              <Icon size={18} style={{ color: iconColor }} strokeWidth={1.75} />
            </div>

            <div className="space-y-2">
              <h3
                className="text-[14px] font-semibold tracking-wide"
                style={{
                  fontFamily: "var(--font-outfit)",
                  color: "var(--color-silver-100)",
                }}
              >
                {label}
              </h3>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--color-silver-400)" }}
              >
                {description}
              </p>
            </div>

            {/* Hover reveal arrow */}
            <div
              className="mt-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-hidden="true"
            >
              <span
                className="text-[11px] font-semibold tracking-widest uppercase"
                style={{ color: iconColor }}
              >
                Explore
              </span>
              <ChevronRight size={11} style={{ color: iconColor }} />
            </div>
          </m.article>
        ))}
      </m.div>
    </section>
  );
}

/* ---------------------------------------------------------------
   How It Works Section
--------------------------------------------------------------- */
function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative px-6 py-24 max-w-5xl mx-auto w-full"
      aria-labelledby="how-it-works-heading"
    >
      {/* Divider */}
      <div className="divider-glass mb-24" aria-hidden="true" />

      <m.div
        className="text-center mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <span
          className="badge-gold mb-4 inline-flex"
          aria-label="Cara kerja"
        >
          Cara Kerja
        </span>
        <h2
          id="how-it-works-heading"
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          style={{
            fontFamily: "var(--font-outfit)",
            color: "var(--color-silver-50)",
          }}
        >
          Dari persiapan hingga siap ujian dalam{" "}
          <span className="text-gradient-gold">tiga langkah</span>
        </h2>
        <p
          className="text-base max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--color-silver-300)" }}
        >
          Alur terstruktur yang mengubah materi pelajaran kamu menjadi sistem
          belajar adaptif yang hidup.
        </p>
      </m.div>

      <div className="flex flex-col gap-6" role="list" aria-label="Process steps">
        {processSteps.map(({ step, Icon, title, detail }, index) => (
          <m.div
            key={step}
            role="listitem"
            className="glass-panel rounded-2xl p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {/* Step number + icon */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <span
                className="text-[11px] font-bold tracking-widest tabular-nums"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--color-gold-400)",
                }}
                aria-label={`Step ${step}`}
              >
                {step}
              </span>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)",
                  border: "1px solid rgba(245,158,11,0.20)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.07) inset, 0 4px 12px rgba(0,0,0,0.4)",
                }}
                aria-hidden="true"
              >
                <Icon
                  size={20}
                  style={{ color: "var(--color-gold-400)" }}
                  strokeWidth={1.5}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1.5">
              <h3
                className="text-[15px] font-semibold"
                style={{
                  fontFamily: "var(--font-outfit)",
                  color: "var(--color-silver-100)",
                }}
              >
                {title}
              </h3>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--color-silver-400)" }}
              >
                {detail}
              </p>
            </div>

            {/* Connector arrow */}
            {index < processSteps.length - 1 && (
              <ChevronRight
                size={18}
                className="hidden sm:block flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.12)" }}
                aria-hidden="true"
              />
            )}
          </m.div>
        ))}
      </div>
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
      <div className="divider-glass mb-24" aria-hidden="true" />

      <m.div
        className="glass-panel rounded-3xl p-10 sm:p-16 relative overflow-hidden"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Background orb for the CTA card */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)",
            filter: "blur(32px)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <span className="badge-gold" aria-label="Available now">
            Available Now — Phase 1
          </span>

          <h2
            id="cta-section-heading"
            className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight"
            style={{
              fontFamily: "var(--font-outfit)",
              color: "var(--color-silver-50)",
            }}
          >
            Mulai semester paling produktif
            <br />
            <span className="text-gradient-gold">kamu sekarang.</span>
          </h2>

          <p
            className="text-base max-w-md leading-relaxed"
            style={{ color: "var(--color-silver-300)" }}
          >
            Gabung dalam demo dan rasakan pengalaman perencanaan belajar adaptif
            berbasis AI yang dirancang untuk keunggulan akademis kamu.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <m.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97, y: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                href="/dashboard"
                onClick={handleStartClick}
                id="cta-section-get-started"
                className="btn-primary text-[15px] px-9 py-3.5"
                aria-label="Mulai StudySync AI sekarang"
              >
                Mulai Sekarang
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </m.div>

            <Link
              href="#features"
              id="cta-section-features"
              className="btn-ghost text-[14px] px-7 py-3.5"
              aria-label="Lihat semua fitur"
            >
              Lihat Semua Fitur
            </Link>
          </div>

          {/* Trust indicators */}
          <div
            className="flex items-center gap-6 pt-2"
            role="list"
            aria-label="Indikator keunggulan"
          >
            {[
              { Icon: Shield, text: "Privasi Utama" },
              { Icon: Zap, text: "Adaptasi Real-Time" },
              { Icon: BrainCircuit, text: "Didukung Gemini AI" },
            ].map(({ Icon, text }) => (
              <div
                key={text}
                role="listitem"
                className="flex items-center gap-1.5"
              >
                <Icon
                  size={12}
                  style={{ color: "var(--color-silver-400)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--color-silver-400)" }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </m.div>

      {/* Footer spacer */}
      <div className="h-12" aria-hidden="true" />
    </section>
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
    </div>
  );
}
