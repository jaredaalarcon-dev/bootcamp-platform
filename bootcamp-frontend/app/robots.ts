// src/app/robots.ts → /robots.txt
import type { MetadataRoute } from "next";

const SITIO = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Zonas privadas: panel admin y secciones del alumno
      disallow: ["/admin", "/dashboard", "/my-courses", "/my-progress", "/certificates", "/profile", "/courses", "/bienvenida"],
    },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
