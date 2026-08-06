"use client";

import { m } from "framer-motion";

interface Orb {
  id: number;
  width: number;
  height: number;
  top: string;
  left: string;
  color: string;
  duration: number;
  delay: number;
  xRange: number[];
  yRange: number[];
}

const orbs: Orb[] = [
  {
    id: 1,
    width: 600,
    height: 600,
    top: "-10%",
    left: "-5%",
    color: "rgba(13, 31, 82, 0.7)",
    duration: 22,
    delay: 0,
    xRange: [0, 40, -20, 0],
    yRange: [0, 30, -10, 0],
  },
  {
    id: 2,
    width: 500,
    height: 500,
    top: "50%",
    left: "70%",
    color: "rgba(20, 41, 102, 0.5)",
    duration: 28,
    delay: 4,
    xRange: [0, -50, 20, 0],
    yRange: [0, -40, 15, 0],
  },
  {
    id: 3,
    width: 350,
    height: 350,
    top: "30%",
    left: "40%",
    color: "rgba(245, 158, 11, 0.04)",
    duration: 18,
    delay: 8,
    xRange: [0, 25, -30, 0],
    yRange: [0, -20, 35, 0],
  },
  {
    id: 4,
    width: 280,
    height: 280,
    top: "75%",
    left: "15%",
    color: "rgba(56, 189, 248, 0.05)",
    duration: 24,
    delay: 2,
    xRange: [0, 35, -15, 0],
    yRange: [0, 20, -30, 0],
  },
];

/**
 * BackgroundCanvas
 *
 * Fixed full-viewport decorative layer rendered behind all page content.
 * Consists of three stacked radial gradient layers that create a deep navy
 * depth illusion, plus four slowly animating blurred orbs that give the
 * background a subtle breathing quality.
 *
 * Pointer events are disabled so it never intercepts user interactions.
 */
export default function BackgroundCanvas() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: "var(--color-navy-950)" }}
    >
      {/* --- Base depth gradient layers --- */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 15% 5%,  rgba(13, 31, 82, 0.85) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 85% 95%, rgba(6, 16, 46, 0.75)  0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(20, 41, 102, 0.20) 0%, transparent 100%)
          `,
        }}
      />

      {/* --- Subtle grid noise texture --- */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* --- Animated orbs --- */}
      {orbs.map((orb) => (
        <m.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            width:  orb.width,
            height: orb.height,
            top:    orb.top,
            left:   orb.left,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(48px)",
            willChange: "transform",
          }}
          animate={{
            x: orb.xRange,
            y: orb.yRange,
          }}
          transition={{
            duration: orb.duration,
            delay:    orb.delay,
            repeat:   Infinity,
            ease:     "easeInOut",
          }}
        />
      ))}

      {/* --- Bottom vignette --- */}
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "linear-gradient(to top, var(--color-navy-950) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
