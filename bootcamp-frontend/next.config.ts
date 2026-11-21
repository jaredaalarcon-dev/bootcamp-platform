import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En Vercel no hace falta nada especial. Para cPanel (u otro servidor con
  // Node.js) se genera una versión "standalone" con: npm run build:cpanel
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
};

export default nextConfig;
