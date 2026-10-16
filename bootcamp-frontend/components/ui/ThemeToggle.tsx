// src/components/ui/ThemeToggle.tsx
// Interruptor de modo claro / oscuro con los colores de la marca:
//  - Oscuro: perilla cian con luna
//  - Claro:  perilla roja con sol
"use client";

import { useTheme } from "@/hooks/useTheme";

const Luna = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
  </svg>
);

const Sol = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
    <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
  </svg>
);

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { esClaro, toggle } = useTheme();
  const etiqueta = esClaro ? "Cambiar a modo oscuro" : "Cambiar a modo claro";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={esClaro}
      aria-label={etiqueta}
      title={etiqueta}
      onClick={toggle}
      className={`theme-toggle keep-theme relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C0E7]/60 ${
        esClaro
          ? "bg-[#e6f9fd] border-[#00C0E7]"
          : "bg-[#0d0d0d] border-[rgba(0,192,231,0.45)]"
      } ${className}`}
    >
      {/* Íconos del fondo (el que NO está activo) */}
      <Sol className={`absolute left-[9px] h-3.5 w-3.5 text-[#E31E24] transition-opacity duration-300 ${esClaro ? "opacity-0" : "opacity-60"}`} />
      <Luna className={`absolute right-[9px] h-3.5 w-3.5 text-[#0093B5] transition-opacity duration-300 ${esClaro ? "opacity-60" : "opacity-0"}`} />

      {/* Perilla */}
      <span
        className={`absolute top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-all duration-300 ${
          esClaro
            ? "left-[3px] bg-[#E31E24] text-white"
            : "left-[31px] bg-[#00C0E7] text-[#0d0d0d] shadow-[0_0_12px_rgba(0,192,231,0.55)]"
        }`}
      >
        {esClaro ? <Sol className="h-3.5 w-3.5" /> : <Luna className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
