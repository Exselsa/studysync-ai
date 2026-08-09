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
  ExternalLink,
  FileText,
  Swords,
  Video,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
   Feature Grid Data (5 Core Platform Features)
--------------------------------------------------------------- */
const coreFeatures = [
  {
    id: "feature-pdf-plan",
    Icon: FileText,
    label: "Rencana Belajar AI & Ekstraksi PDF",
    description:
      "Unggah materi kuliah atau slide PDF kamu, otomatis dibuatkan Study Plan adaptif dan rangkuman santai oleh abang ganteng.",
    accent: "rgba(245, 158, 11, 0.12)",
    accentBorder: "rgba(245, 158, 11, 0.22)",
    iconColor: "var(--color-gold-400)",
  },
  {
    id: "feature-feynman-boss",
    Icon: Swords,
    label: "Feynman Boss Fight & Duel 1v1",
    description:
      "Uji pemahaman materi kamu lewat battle game interaktif, fitur countdown timer, dan pesan taunt real-time ('kenak mental', 'mantap jiwa').",
    accent: "rgba(239, 68, 68, 0.10)",
    accentBorder: "rgba(239, 68, 68, 0.24)",
    iconColor: "rgba(244, 63, 94, 0.95)",
  },
  {
    id: "feature-ai-tutor",
    Icon: BrainCircuit,
    label: "AI Tutor Adaptif (Setup Wizard)",
    description:
      "Asisten belajar personal bersama abang ganteng yang otomatis menyesuaikan kedalaman penjelasan khusus untuk jenjang SMA maupun Kuliah.",
    accent: "rgba(56, 189, 248, 0.10)",
    accentBorder: "rgba(56, 189, 248, 0.24)",
    iconColor: "rgba(56, 189, 248, 0.95)",
  },
  {
    id: "feature-study-meet",
    Icon: Video,
    label: "Collaborative Study Meet",
    description:
      "Ruang belajar real-time buat mabar bareng teman, berbagi catatan live, dan panggil penjelasan abang ganteng bersama.",
    accent: "rgba(168, 85, 247, 0.10)",
    accentBorder: "rgba(168, 85, 247, 0.24)",
    iconColor: "rgba(168, 85, 247, 0.95)",
  },
  {
    id: "feature-daily-tasks",
    Icon: CheckSquare,
    label: "Tugas Prioritas Hari Ini",
    description:
      "Dashboard terintegrasi yang otomatis mensinkronkan target harian kamu dari Study Plan aktif secara konsisten.",
    accent: "rgba(34, 197, 94, 0.10)",
    accentBorder: "rgba(34, 197, 94, 0.24)",
    iconColor: "rgba(34, 197, 94, 0.95)",
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
            aria-label="Powered by abang ganteng"
          >
            <Zap
              size={10}
              strokeWidth={2.5}
              style={{ color: "var(--color-gold-300)" }}
              aria-hidden="true"
            />
            BITSMIKRO INNOVATIVE VIBECODE — Phase 1 Demo
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
              { Icon: BrainCircuit, text: "Didukung abang ganteng" },
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
   Instagram SVG Icon Component
--------------------------------------------------------------- */
function InstagramIcon({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
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

/* ---------------------------------------------------------------
   Team Data & Interactive Member Card
--------------------------------------------------------------- */
const teamMembers = [
  {
    name: "MUH.D.FIRDAUS",
    role: "Full-Stack Dev",
    handle: "@_daffafirdaus0",
    instagram: "https://www.instagram.com/_daffafirdaus0?igsh=MTMwdjI5OXhuY2hyMQ==",
    imageSrc: "/team/muh.d.firdaus.jpeg",
    bio: "tidak dapat bicara,mutualan ig saja,sekalian bantu orang kecil ini mencapai 1000 follower pertamanya",
    accentGlow: "rgba(245, 158, 11, 0.3)",
    roleBadgeStyle: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    name: "RIO ARRASYID H",
    role: "Frontend Dev",
    handle: "@riorasyidd",
    instagram: "https://www.instagram.com/riorasyidd?igsh=MWgyYmN6NWhiag==",
    imageSrc: "/team/rio_arrasyid_h.jpeg",
    bio: "tidak ada yang diberi, semua harus diraih",
    accentGlow: "rgba(56, 189, 248, 0.3)",
    roleBadgeStyle: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  {
    name: "ARIEF RACHMAN",
    role: "Backend Dev",
    handle: "@arippyon",
    instagram: "https://www.instagram.com/arippyon?igsh=MXYwaGNlZ29mNngxdw==",
    imageSrc: "/team/arief_rachman.jpeg",
    bio: "Kasih banjir bang",
    accentGlow: "rgba(168, 85, 247, 0.3)",
    roleBadgeStyle: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
];

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
      className="backdrop-blur-xl bg-slate-900/60 border border-white/15 rounded-3xl p-7 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_12px_30px_rgba(0,0,0,0.5)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_20px_45px_rgba(0,0,0,0.7)] group"
    >
      {/* Top Gloss Highlight Sheen */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none z-10" />

      {/* Interactive Liquid Mouse-Tracking Spotlight */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.25), rgba(59, 130, 246, 0.15), transparent 80%)`,
        }}
      />

      {/* Ambient Base Glow */}
      <div
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-300"
        style={{ background: member.accentGlow }}
      />

      {/* Floating 3D Profile Frame */}
      <m.div
        className="relative mb-6 z-10"
        animate={prefersReduced ? {} : { y: [0, -7, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.4,
        }}
      >
        {/* Outer 3D Bevel Ring with Glow */}
        <div
          className="p-1.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_10px_25px_rgba(0,0,0,0.6)] transition-all duration-300 group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_0_30px_rgba(245,158,11,0.3)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.15) 100%)",
          }}
        >
          {/* Inner Bevel Circular Photo Container */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-slate-950/80 border border-white/20 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)]">
            <img
              src={member.imageSrc}
              alt={`Foto ${member.name}`}
              className="w-24 h-24 rounded-full object-cover p-0.5 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </div>

        {/* Skeuomorphic Core Dev Badge */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-white/20 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.5)]">
          Core Dev
        </div>
      </m.div>

      {/* Member Details */}
      <div className="space-y-2 mb-6 flex-1 flex flex-col items-center z-10">
        <h3
          className="text-xl font-bold tracking-tight text-slate-100 group-hover:text-amber-300 transition-colors uppercase"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          {member.name}
        </h3>

        <div
          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${member.roleBadgeStyle}`}
        >
          {member.role}
        </div>

        <p
          className="text-xs sm:text-sm leading-relaxed max-w-xs mt-3"
          style={{ color: "var(--color-silver-300)" }}
        >
          {member.bio}
        </p>
      </div>

      {/* Tactile Skeuomorphic Instagram Button */}
      <a
        href={member.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_18px_rgba(219,39,119,0.35)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] active:scale-[0.97] border border-white/25 transition-all duration-200 group/btn z-10"
        aria-label={`Kunjungi profil Instagram ${member.name}`}
      >
        <InstagramIcon className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] group-hover/btn:rotate-6 transition-transform" />
        <span>{member.handle}</span>
        <ExternalLink
          size={13}
          className="text-white/80 opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all"
        />
      </a>
    </m.article>
  );
}

/* ---------------------------------------------------------------
   About Us Section ("Kenalan Sama Tim")
--------------------------------------------------------------- */
function AboutUsSection() {
  return (
    <section
      id="about-us"
      className="relative px-6 py-24 max-w-7xl mx-auto w-full"
      aria-labelledby="about-heading"
    >
      <div className="divider-glass mb-20" aria-hidden="true" />

      {/* Section Header */}
      <m.div
        className="text-center mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <span className="badge-gold mb-4 inline-flex" aria-label="Kenalan Yuk">
          KENALAN YUK
        </span>
        <h2
          id="about-heading"
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          style={{
            fontFamily: "var(--font-outfit)",
            color: "var(--color-silver-50)",
          }}
        >
          Nama Tim Kami{" "}
          <span className="text-gradient-gold">Doa Ibu Mama Bapak Papa</span>
        </h2>
        <p
          className="text-base max-w-xl mx-auto leading-relaxed"
          style={{ color: "var(--color-silver-300)" }}
        >
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
   Footer Section
--------------------------------------------------------------- */
function FooterSection() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/80 backdrop-blur-xl py-12 px-6 mt-12 text-center text-xs text-slate-400 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-base font-bold text-slate-100 tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
            StudySync<span className="text-amber-400">-AI</span>
          </span>
          <p className="text-slate-400 text-xs">
            Platform Belajar Adaptif Berbasis AI
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium text-slate-300">
          <Link href="#features" className="hover:text-amber-400 transition-colors">
            Fitur
          </Link>
          <Link href="#how-it-works" className="hover:text-amber-400 transition-colors">
            Cara Kerja
          </Link>
          <Link href="#about-us" className="hover:text-amber-400 transition-colors">
            Tim Kami
          </Link>
          <Link href="/dashboard" className="hover:text-amber-400 transition-colors">
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

