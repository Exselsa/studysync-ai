import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const EMIL_EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EMIL_EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
export const EMIL_SPRING_TRANSITION = { type: "spring" as const, stiffness: 380, damping: 30 };

export { gsap, ScrollTrigger };
