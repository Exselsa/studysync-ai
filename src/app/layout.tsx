import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import NavigationBar from "@/components/layout/NavigationBar";
import BackgroundCanvas from "@/components/layout/BackgroundCanvas";

/* ---------------------------------------------------------------
   Font Loading — Plus Jakarta Sans (body) + Space Grotesk (headings)
   CSS variables are injected into the <html> element so both
   Tailwind utilities and raw CSS var() references work.
--------------------------------------------------------------- */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/* ---------------------------------------------------------------
   Metadata
--------------------------------------------------------------- */
export const metadata: Metadata = {
  title: {
    default:  "StudySync AI — Intelligent Study Planner",
    template: "%s · StudySync AI",
  },
  description:
    "AI-powered smart study planner that adapts to your schedule, learning style, and academic goals. Built for students who demand precision.",
  keywords: [
    "study planner",
    "AI study assistant",
    "academic scheduler",
    "smart learning",
    "StudySync AI",
  ],
  authors: [{ name: "StudySync AI Team" }],
  robots: { index: true, follow: true },
  openGraph: {
    type:        "website",
    locale:      "en_US",
    siteName:    "StudySync AI",
    title:       "StudySync AI — Intelligent Study Planner",
    description:
      "AI-powered smart study planner that adapts to your schedule, learning style, and academic goals.",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/* ---------------------------------------------------------------
   Root Layout
--------------------------------------------------------------- */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          {/* Fixed decorative background — rendered behind everything */}
          <BackgroundCanvas />

          {/* Fixed navigation bar */}
          <NavigationBar />

          {/* Page content — offset by nav height */}
          <main
            id="main-content"
            className="flex flex-col flex-1 pt-16"
            tabIndex={-1}
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
