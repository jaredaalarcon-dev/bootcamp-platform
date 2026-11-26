import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En Vercel no hace falta nada especial. Para cPanel (u otro servidor con
  // Node.js) se genera una versión "standalone" con: npm run build:cpanel
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  // Caché del navegador para el modelo 3D y los logos (no cambian de nombre
  // con cada versión): 1 día, y se renuevan en segundo plano hasta 7 días.
  // Las páginas y el JavaScript los maneja Next.js (cada versión nueva tiene
  // nombres de archivo distintos, así que nunca se ve una versión vieja).
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return [
      { source: "/models/:path*", headers: cache },
      { source: "/brand/:path*", headers: cache },
    ];
  },
};

export default nextConfig;
