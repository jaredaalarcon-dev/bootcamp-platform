// src/app/notifications/page.tsx — todas las notificaciones del alumno
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { StudentLayout } from "@/components/ui/StudentLayout";
import { NotificationIcon } from "@/components/notifications/NotificationIcon";
import { EVENTO_NOTIFICACIONES } from "@/components/notifications/NotificationBell";
import { Notificacion, haceCuanto, notificationsApi } from "@/hooks/useCommunityApi";

type Filtro = "todas" | "sin_leer";

export default function NotificationsPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [items, setItems] = useState<Notificacion[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    notificationsApi.list(100).then((r) => setItems(r.items)).catch(() => { setItems([]); toast.error("No se pudieron cargar tus notificaciones"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avisarCampana = () => window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES));
  const sinLeer = items?.filter((n) => !n.readAt).length ?? 0;
  const visibles = (items ?? []).filter((n) => filtro === "todas" || !n.readAt);

  const abrir = async (n: Notificacion) => {
    if (!n.readAt) {
      setItems((p) => p?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) ?? p);
      await notificationsApi.read(n.id).catch(() => {});
      avisarCampana();
    }
    if (n.link) router.push(n.link);
  };

  const leerTodas = async () => {
    setItems((p) => p?.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })) ?? p);
    await notificationsApi.readAll().catch(() => {});
    avisarCampana();
  };

  const borrar = async (n: Notificacion) => {
    setItems((p) => p?.filter((x) => x.id !== n.id) ?? p);
    await notificationsApi.remove(n.id).catch(() => toast.error("No se pudo eliminar"));
    avisarCampana();
  };

  return (
    <StudentLayout>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Notificaciones</h1>
            <p className="text-gray-500 text-sm mt-1">Cursos nuevos, respuestas a tus preguntas y avisos de tus certificados.</p>
          </div>
          {sinLeer > 0 && (
            <button onClick={leerTodas} className="btn-cyan text-xs px-3 py-2 self-start sm:self-auto">
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {([["todas", "Todas"], ["sin_leer", `Sin leer${sinLeer ? ` (${sinLeer})` : ""}`]] as [Filtro, string][]).map(([k, t]) => (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtro === k
                  ? "bg-[rgba(0,192,231,0.15)] border-[#00C0E7]/50 text-[#00C0E7]"
                  : "border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {items === null ? (
          <div className="flex justify-center py-16"><div className="spinner-cyan" /></div>
        ) : visibles.length === 0 ? (
          <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,192,231,0.1)]">
              <svg className="w-7 h-7 text-[#00C0E7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-white font-semibold">{filtro === "sin_leer" ? "Estás al día" : "Aún no tienes notificaciones"}</p>
            <p className="text-gray-500 text-sm mt-1">{filtro === "sin_leer" ? "No tienes avisos pendientes por leer." : "Cuando haya novedades, aparecerán aquí."}</p>
          </div>
        ) : (
          <ul className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl overflow-hidden divide-y divide-gray-800">
            {visibles.map((n) => (
              <li key={n.id} className={`group flex gap-3 sm:gap-4 p-4 ${n.readAt ? "" : "bg-[rgba(0,192,231,0.05)]"}`}>
                <button onClick={() => abrir(n)} className="flex flex-1 min-w-0 gap-3 sm:gap-4 text-left">
                  <NotificationIcon type={n.type} className="w-10 h-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className={`text-sm leading-snug flex-1 ${n.readAt ? "text-gray-300" : "text-white font-semibold"}`}>{n.title}</p>
                      {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#00C0E7]" aria-label="Sin leer" />}
                    </div>
                    <p className="text-gray-400 text-sm mt-1 break-words">{n.message}</p>
                    <p className="text-gray-600 text-xs mt-1.5">
                      {haceCuanto(n.createdAt)}
                      {n.link && <span className="text-[#00C0E7] font-semibold"> · Ver detalle →</span>}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => borrar(n)}
                  aria-label="Eliminar notificación"
                  className="self-start p-1.5 rounded-lg text-gray-600 hover:text-[#E31E24] hover:bg-[rgba(255,255,255,0.05)] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StudentLayout>
  );
}
