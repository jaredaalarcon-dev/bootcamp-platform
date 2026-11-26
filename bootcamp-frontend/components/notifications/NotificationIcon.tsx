// src/components/notifications/NotificationIcon.tsx — ícono y color por tipo de aviso
import type { TipoNotificacion } from "@/hooks/useCommunityApi";

const ESTILO: Record<TipoNotificacion, { fondo: string; color: string; d: string }> = {
  curso_nuevo: {
    fondo: "bg-[rgba(0,192,231,0.12)]", color: "text-[#00C0E7]",
    d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  certificado: {
    fondo: "bg-[rgba(227,30,36,0.12)]", color: "text-[#E31E24]",
    d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  constancia: {
    fondo: "bg-emerald-500/10", color: "text-emerald-400",
    d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  respuesta: {
    fondo: "bg-[rgba(0,192,231,0.12)]", color: "text-[#00C0E7]",
    d: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  general: {
    fondo: "bg-gray-800", color: "text-gray-400",
    d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

export function NotificationIcon({ type, className = "w-9 h-9" }: { type: TipoNotificacion; className?: string }) {
  const e = ESTILO[type] ?? ESTILO.general;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl ${e.fondo} ${className}`}>
      <svg className={`w-[55%] h-[55%] ${e.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={e.d} />
      </svg>
    </span>
  );
}
