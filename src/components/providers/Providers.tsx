"use client";

import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig
          reducedMotion="user"
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <AuthProvider>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </AuthProvider>
        </MotionConfig>
      </LazyMotion>
    </ThemeProvider>
  );
}
