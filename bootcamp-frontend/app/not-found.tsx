// src/app/not-found.tsx — página 404 con el diseño de la marca
import Link from "next/link";
import type { Metadata } from "next";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <header className="border-b border-[rgba(0,192,231,0.12)] bg-[#111827]">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Link href="/" aria-label="Ir al inicio"><BrandLogo width={170} /></Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <div className="relative mx-auto w-40 h-40 mb-6">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(0,192,231,0.25),transparent_70%)]" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/cubo-gorro.png" alt="" className="relative w-full h-full object-contain nf-flota" />
          </div>
          <p className="font-brand text-7xl text-[#00C0E7] leading-none tracking-wide">404</p>
          <h1 className="text-white text-xl font-semibold mt-3">No encontramos esta página</h1>
          <p className="text-gray-400 text-sm mt-2">
            Puede que el enlace esté mal escrito o que la página ya no exista. Te llevamos de vuelta.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link href="/" className="btn-red text-sm px-6 py-2.5">Ir al inicio</Link>
            <Link href="/dashboard" className="btn-cyan text-sm px-6 py-2.5">Mi panel</Link>
          </div>
          <p className="text-gray-500 text-xs mt-6">¿Necesitas ayuda? Pregúntale a JB Assist, abajo a la derecha.</p>
        </div>
      </main>
    </div>
  );
}
