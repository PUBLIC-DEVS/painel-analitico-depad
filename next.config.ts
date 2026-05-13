import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    // Força a raiz para o diretório atual para evitar confusão com lockfiles em pastas superiores (/Users/daniel)
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
