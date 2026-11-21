// src/app/bienvenida/page.tsx
// Pantalla de "¡Gracias por registrarte!" con los siguientes pasos.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const PASOS = [
  { n: "1", titulo: "Confirma tu correo", texto: "Te enviamos un enlace de confirmación. Si no lo ves, revisa la carpeta de spam o promociones." },
  { n: "2", titulo: "Inicia sesión", texto: "Entra con tu correo y contraseña para ver tu panel." },
  { n: "3", titulo: "Elige tu curso", texto: "En «Explorar cursos» pulsa Inscribirme. Avanza a tu ritmo; tu progreso se guarda solo." },
  { n: "4", titulo: "Obtén tu constancia", texto: "Al completar el 100 % descargas gratis tu constancia. El certificado oficial se solicita por WhatsApp." },
];

export default function BienvenidaPage() {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    try {
      setNombre(sessionStorage.getItem("sijb-nuevo-nombre") ?? "");
    } catch {
      /* navegador sin almacenamiento */
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <header className="border-b border-[rgba(0,192,231,0.12)] bg-[#111827]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" aria-label="Ir al inicio"><BrandLogo width={170} /></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#00C0E7] text-[#0d0d0d] flex items-center justify-center text-3xl font-bold" aria-hidden="true">
            ✓
          </div>
          <h1 className="font-brand text-[#00C0E7] text-3xl uppercase tracking-wide mt-5">
            ¡Gracias por registrarte{nombre ? `, ${nombre}` : ""}!
          </h1>
          <p className="text-gray-400 mt-2">Tu cuenta en la Plataforma Bootcamp de Soluciones Integrales JB está lista. Estos son tus siguientes pasos:</p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2">
          {PASOS.map((p) => (
            <li key={p.n} className="card-dark p-5 flex gap-4">
              <span className="w-9 h-9 shrink-0 rounded-full border-2 border-[#00C0E7] text-[#00C0E7] font-brand text-lg flex items-center justify-center">
                {p.n}
              </span>
              <div>
                <p className="text-white font-semibold">{p.titulo}</p>
                <p className="text-gray-400 text-sm mt-1">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Link href="/login" className="btn-red text-sm px-8 py-3">Iniciar sesión</Link>
          <Link href="/blog" className="btn-cyan text-sm px-6 py-3">Ver el Blog</Link>
        </div>
        <p className="text-center text-gray-500 text-xs mt-6">
          ¿Dudas? Pregúntale a JB Assist (abajo a la derecha) o revisa los{" "}
          <Link href="/terminos" className="text-[#00C0E7] hover:underline">Términos y Condiciones</Link>.
        </p>
      </main>
    </div>
  );
}
