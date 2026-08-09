"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, SendHorizonal } from "lucide-react";
import {
  ShaderMount,
  liquidMetalFragmentShader,
  type ShaderMountUniforms,
} from "@paper-design/shaders";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------ */
interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface LiquidMetalButtonProps {
  /** Text label shown in "label" mode */
  label?: string;
  /** "label" renders a full pill button; "icon" renders a send-icon circle */
  viewMode?: "label" | "icon";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  id?: string;
  "aria-label"?: string;
}

/* ------------------------------------------------------------------
   Shader colours — deep navy + gold tint for the StudySync palette
------------------------------------------------------------------ */
const SHADER_COLOR_BACK = "#0d1f52"; // navy-700
const SHADER_COLOR_TINT = "#06b6d4"; // electric cyan-500

/* ------------------------------------------------------------------
   LiquidMetalButton
------------------------------------------------------------------ */
export default function LiquidMetalButton({
  label = "Start AI Session",
  viewMode = "label",
  onClick,
  disabled = false,
  type = "button",
  id,
  "aria-label": ariaLabel,
}: LiquidMetalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shaderMountRef = useRef<ShaderMount | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const rippleIdRef = useRef(0);

  /* ----------------------------------------------------------------
     Mount the ShaderMount WebGL canvas onto the button div
  ---------------------------------------------------------------- */
  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const mount = new ShaderMount(
      parent,
      liquidMetalFragmentShader,
      // ShaderMountUniforms is [key: string]: boolean | number | number[] | number[][] | HTMLImageElement | undefined.
      // The library resolves colorBack/colorTint/shape strings internally at runtime;
      // we satisfy the TS type by casting only the string fields to `unknown as number`
      // while keeping numeric values exactly as-is.
      {
        // String params are resolved by the shader runtime → cast to satisfy the index sig
        colorBack: SHADER_COLOR_BACK as unknown as number,
        colorTint: SHADER_COLOR_TINT as unknown as number,
        shape: "circle" as unknown as number,
        // Numeric params are already compatible
        repetition: 3,
        softness: 0.55,
        distortion: 0.45,
        contour: 0.6,
        shiftRed: 0.08,
        shiftBlue: -0.06,
        angle: 225,
      } satisfies ShaderMountUniforms,
      undefined,
      0.55
    );

    shaderMountRef.current = mount;

    return () => {
      mount.dispose();
      shaderMountRef.current = null;
    };
  }, []);

  /* ----------------------------------------------------------------
     Speed up animation on hover via live uniform update
  ---------------------------------------------------------------- */
  useEffect(() => {
    const mount = shaderMountRef.current;
    if (!mount) return;
    // ShaderMount.setUniforms is typed as (ShaderMountUniforms) => void
    mount.setUniforms({ speed: isHovered ? 1.8 : 0.55 });
  }, [isHovered]);

  /* ----------------------------------------------------------------
     Ripple on click
  ---------------------------------------------------------------- */
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = ++rippleIdRef.current;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
    onClick?.();
  }

  const isIcon = viewMode === "icon";

  return (
    <button
      type={type}
      id={id}
      disabled={disabled}
      aria-label={ariaLabel ?? (isIcon ? "Send message" : label)}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isIcon ? 0 : "0.5rem",
        padding: isIcon ? 0 : "0.625rem 1.5rem",
        width: isIcon ? "2.5rem" : undefined,
        height: isIcon ? "2.5rem" : undefined,
        borderRadius: isIcon ? "50%" : "var(--radius-btn, 10px)",
        fontFamily: "var(--font-inter, sans-serif)",
        fontSize: "0.875rem",
        fontWeight: 600,
        letterSpacing: "0.025em",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.18)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        overflow: "hidden",
        transition: "transform 80ms ease, box-shadow 80ms ease",
        transform: isHovered && !disabled ? "translateY(-2px)" : "translateY(0)",
        boxShadow: isHovered && !disabled
          ? "0 0 20px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.2), 0 4px 12px rgba(0,0,0,0.5)"
          : "0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset",
        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* ShaderMount container — absolutely fills the button */}
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden" }}
      />

      {/* Glass gloss overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 60%)",
          borderRadius: "inherit",
          pointerEvents: "none",
        }}
      />

      {/* Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${r.x}%`,
            top: `${r.y}%`,
            transform: "translate(-50%, -50%) scale(0)",
            width: "120%",
            paddingTop: "120%",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            animation: "lmb-ripple 0.7s ease-out forwards",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      ))}

      {/* Label / icon content */}
      <span
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: isIcon ? 0 : "0.5rem",
        }}
      >
        {isIcon ? (
          <SendHorizonal size={16} strokeWidth={2} aria-hidden="true" />
        ) : (
          <>
            <Sparkles size={15} aria-hidden="true" />
            {label}
          </>
        )}
      </span>

      <style>{`
        @keyframes lmb-ripple {
          to { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
    </button>
  );
}
