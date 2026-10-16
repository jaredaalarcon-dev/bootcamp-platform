// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const BENEFICIOS = [
  { icon: "🎓", titulo: "Cursos completos", texto: "Módulos y lecciones en video organizados paso a paso." },
  { icon: "📊", titulo: "Tu progreso real", texto: "Marca lecciones como vistas y retoma donde lo dejaste." },
  { icon: "🏆", titulo: "Certificados", texto: "Obtén tu certificado al completar el 100% de un curso." },
];

export default function Home() {
  const router = useRouter();

  // Si ya tiene sesión, lo llevamos directo a su panel
  useEffect(() => {
    try {
      if (localStorage.getItem("accessToken")) router.replace("/dashboard");
    } catch {}
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      {/* Barra superior */}
      <header className="border-b border-[rgba(0,192,231,0.12)]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <BrandLogo width={230} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/blog" className="hidden sm:inline text-sm font-semibold text-gray-300 hover:text-[#00C0E7] transition-colors">
              Blog
            </Link>
            <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-[#00C0E7] transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn-red text-sm py-2 px-4">Crear cuenta</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <div className="mx-auto max-w-6xl px-6 py-16 w-full">
          <div className="max-w-2xl">
            <p className="text-[#00C0E7] text-sm font-bold uppercase tracking-widest mb-3">Tu mejor opción tecnológica</p>
            <h1 className="font-brand text-white text-4xl sm:text-5xl uppercase leading-tight">
              Aprende tecnología con <span className="text-[#00C0E7]">Soluciones Integrales JB</span>
            </h1>
            <div className="h-[3px] w-20 bg-[#E31E24] rounded my-6" />
            <p className="text-gray-400 text-lg leading-relaxed">
              Cursos de desarrollo web, inteligencia artificial, ciberseguridad y más.
              Avanza a tu ritmo y obtén tu certificado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-red">Empezar gratis</Link>
              <Link href="/login" className="btn-cyan">Ya tengo cuenta</Link>
            </div>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <div key={b.titulo} className="card-dark p-6">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="text-white font-semibold">{b.titulo}</h3>
                <p className="text-gray-500 text-sm mt-1">{b.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-900 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Soluciones Integrales JB S.A.C. Todos los derechos reservados.
      </footer>
    </div>
  );
}
