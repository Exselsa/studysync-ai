import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Transpile ESM-only packages for Turbopack compatibility */
  transpilePackages: ["@paper-design/shaders", "@google/genai"],
};

export default nextConfig;
