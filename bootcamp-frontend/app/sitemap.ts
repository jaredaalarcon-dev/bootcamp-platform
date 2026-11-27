// src/app/sitemap.ts → /sitemap.xml
// Páginas públicas que Google puede indexar. Las del alumno, el blog (solo con cuenta) y el admin no se incluyen.
import type { MetadataRoute } from "next";

const SITIO = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date();
  const paginas: { ruta: string; prioridad: number; frecuencia: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { ruta: "", prioridad: 1, frecuencia: "weekly" },
    { ruta: "/register", prioridad: 0.7, frecuencia: "monthly" },
    { ruta: "/login", prioridad: 0.5, frecuencia: "monthly" },
    { ruta: "/verificar", prioridad: 0.5, frecuencia: "monthly" },
    { ruta: "/libro-de-reclamaciones", prioridad: 0.3, frecuencia: "yearly" },
    { ruta: "/terminos", prioridad: 0.3, frecuencia: "yearly" },
    { ruta: "/privacidad", prioridad: 0.3, frecuencia: "yearly" },
  ];
  return paginas.map((p) => ({
    url: `${SITIO}${p.ruta}`,
    lastModified: hoy,
    changeFrequency: p.frecuencia,
    priority: p.prioridad,
  }));
}
