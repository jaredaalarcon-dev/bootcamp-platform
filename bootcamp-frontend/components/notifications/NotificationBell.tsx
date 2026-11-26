// src/components/notifications/NotificationBell.tsx — campana con avisos del alumno
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Notificacion, haceCuanto, notificationsApi } from "@/hooks/useCommunityApi";
import { NotificationIcon } from "./NotificationIcon";

// Evento para que otras partes (la página de notificaciones) actualicen la campana
export const EVENTO_NOTIFICACIONES = "sijb:notificaciones";

export function NotificationBell() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [sinLeer, setSinLeer] = useState(0);
  const [items, setItems] = useState<Notificacion[] | null>(null);
  const caja = useRef<HTMLDivElement>(null);

  const contar = useCallback(() => {
    notificationsApi.unread().then(setSinLeer).catch(() => {});
  }, []);

  const cargar = useCallback(() => {
    notificationsApi.list(8).then((r) => { setItems(r.items); setSinLeer(r.unread); }).catch(() => setItems([]));
  }, []);

  // Contador: al entrar, cada minuto y al volver a la pestaña
  useEffect(() => {
    contar();
    const t = setInterval(() => { if (document.visibilityState === "visible") contar(); }, 60_000);
    const alVolver = () => { if (document.visibilityState === "visible") contar(); };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener(EVENTO_NOTIFICACIONES, contar);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener(EVENTO_NOTIFICACIONES, contar);
    };
  }, [contar]);

  // Cerrar al hacer clic fuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => { if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [abierto]);

  const alternar = () => {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo) cargar();
  };

  const abrirAviso = async (n: Notificacion) => {
    setAbierto(false);
    if (!n.readAt) {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) ?? prev);
      setSinLeer((c) => Math.max(0, c - 1));
      notificationsApi.read(n.id).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  const leerTodas = async () => {
    setItems((prev) => prev?.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })) ?? prev);
    setSinLeer(0);
    await notificationsApi.readAll().catch(() => {});
  };

  return (
    <div className="relative" ref={caja}>
      <button
        onClick={alternar}
        aria-label={sinLeer ? `Notificaciones: ${sinLeer} sin leer` : "Notificaciones"}
        aria-expanded={abierto}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {sinLeer > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E31E24] text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-[#111827]">
            {sinLeer > 9 ? "9+" : sinLeer}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-x-3 top-16 z-[80] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-[#111827] border border-[rgba(0,192,231,0.2)] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <p className="text-white font-semibold text-sm">Notificaciones</p>
            {sinLeer > 0 && (
              <button onClick={leerTodas} className="text-xs font-semibold text-[#00C0E7] hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {items === null ? (
              <div className="flex justify-center py-8"><div className="spinner-cyan" /></div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-gray-400 text-sm font-medium">No tienes notificaciones</p>
                <p className="text-gray-500 text-xs mt-1">Aquí verás cursos nuevos, respuestas a tus preguntas y tus certificados.</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => abrirAviso(n)}
                  className={`w-full flex gap-3 px-4 py-3 text-left border-b border-gray-800/60 last:border-b-0 hover:bg-[rgba(255,255,255,0.05)] transition-colors ${n.readAt ? "" : "bg-[rgba(0,192,231,0.05)]"}`}
                >
                  <NotificationIcon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${n.readAt ? "text-gray-300" : "text-white font-semibold"}`}>{n.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-gray-600 text-[11px] mt-1">{haceCuanto(n.createdAt)}</p>
                  </div>
                  {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#00C0E7]" aria-label="Sin leer" />}
                </button>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setAbierto(false)}
            className="block text-center text-sm font-semibold text-[#00C0E7] py-3 border-t border-gray-800 hover:bg-[rgba(255,255,255,0.05)]"
          >
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}
