// src/components/ui/Stars.tsx — estrellas para mostrar o elegir una calificación
"use client";

import { useState } from "react";

const RUTA = "M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z";

interface Props {
  value: number;               // 0 a 5 (admite decimales al mostrar)
  size?: number;               // px
  onChange?: (v: number) => void;
  className?: string;
  label?: string;
}

export function Stars({ value, size = 16, onChange, className = "", label }: Props) {
  const [hover, setHover] = useState(0);
  const mostrado = hover || value;
  const interactivo = !!onChange;

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={interactivo ? "radiogroup" : "img"}
      aria-label={label ?? `${value.toFixed(1).replace(".0", "")} de 5 estrellas`}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const relleno = Math.max(0, Math.min(1, mostrado - (n - 1)));
        const estrella = (
          <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <defs>
              <linearGradient id={`st-${n}-${Math.round(relleno * 100)}`}>
                <stop offset={`${relleno * 100}%`} stopColor="#F5B301" />
                <stop offset={`${relleno * 100}%`} stopColor="currentColor" />
              </linearGradient>
            </defs>
            <path d={RUTA} fill={`url(#st-${n}-${Math.round(relleno * 100)})`} className="text-gray-700 stars-vacia" />
          </svg>
        );
        if (!interactivo) return <span key={n}>{estrella}</span>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange!(n)}
            className="p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C0E7]"
          >
            {estrella}
          </button>
        );
      })}
    </div>
  );
}
