// src/components/admin/N8nPanel.tsx — estado de la conexión con n8n y prueba
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api-client";

interface EstadoN8n {
  configurado: boolean;
  firmado: boolean;
  destino: string | null;
  apiHabilitada: boolean;
  enviados: number;
  fallidos: number;
  ultimo: { evento: string; ok: boolean; fecha: string; detalle?: string } | null;
  eventos: { evento: string; descripcion: string }[];
}

function Insignia({ ok, si, no }: { ok: boolean; si: string; no: string }) {
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${ok ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-800 text-gray-400"}`}>
      {ok ? `✓ ${si}` : no}
    </span>
  );
}

export function N8nPanel() {
  const [estado, setEstado] = useState<EstadoN8n | null>(null);
  const [probando, setProbando] = useState(false);
  const [verEventos, setVerEventos] = useState(false);

  const cargar = () => apiClient.get("/admin/integrations/n8n").then((r) => setEstado(r.data.data)).catch(() => setEstado(null));
  useEffect(() => { cargar(); }, []);

  const probar = async () => {
    setProbando(true);
    try {
      const { data } = await apiClient.post("/admin/integrations/n8n/test");
      if (data.data.ok) toast.success(data.data.detalle);
      else toast.error(data.data.detalle);
      cargar();
    } catch {
      toast.error("No se pudo enviar la prueba");
    } finally {
      setProbando(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EA4B71]/15 text-[#EA4B71] font-black text-sm">n8n</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-brand text-[#00C0E7] text-sm uppercase tracking-wide">Automatizaciones con n8n</h3>
          <p className="text-gray-500 text-xs">Envía correos, mensajes o reportes automáticos cuando pasa algo en la plataforma.</p>
        </div>
        {estado && <Insignia ok={estado.configurado} si="Conectado" no="Sin configurar" />}
      </div>

      <div className="p-5 space-y-4">
        {!estado ? (
          <p className="text-gray-500 text-sm">No se pudo leer el estado.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-800/60 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Destino</p>
                <p className="text-white text-sm font-semibold truncate">{estado.destino ?? "—"}</p>
                <div className="mt-1"><Insignia ok={estado.firmado} si="Eventos firmados" no="Sin clave secreta" /></div>
              </div>
              <div className="rounded-lg bg-gray-800/60 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Desde que inició el servidor</p>
                <p className="text-white text-sm font-semibold">{estado.enviados} enviados · {estado.fallidos} con error</p>
                {estado.ultimo && (
                  <p className={`text-[11px] mt-1 ${estado.ultimo.ok ? "text-emerald-400" : "text-[#E31E24]"}`}>
                    Último: {estado.ultimo.evento} · {new Date(estado.ultimo.fecha).toLocaleString("es-PE", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-gray-800/60 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">n8n → plataforma</p>
                <p className="text-white text-sm font-semibold">{estado.apiHabilitada ? "Puede enviar avisos" : "Desactivado"}</p>
                <p className="text-gray-500 text-[11px] mt-1">Recordatorios y avisos a los alumnos</p>
              </div>
            </div>

            {!estado.configurado && (
              <div className="rounded-lg border border-[rgba(0,192,231,0.25)] bg-[rgba(0,192,231,0.05)] p-3 text-sm text-gray-300">
                Para activarlo, agrega en <b className="text-white">Render → Environment</b> las variables <code className="text-[#00C0E7]">N8N_WEBHOOK_URL</code>,{" "}
                <code className="text-[#00C0E7]">N8N_WEBHOOK_SECRET</code> y (opcional) <code className="text-[#00C0E7]">N8N_API_KEY</code>. La guía completa está en{" "}
                <code className="text-[#00C0E7]">docs/N8N.md</code> del repositorio.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={probar} disabled={!estado.configurado || probando} className="btn-cyan text-sm px-4 py-2 disabled:opacity-40">
                {probando ? "Enviando..." : "Enviar evento de prueba"}
              </button>
              <button onClick={() => setVerEventos((v) => !v)} className="text-sm text-gray-400 hover:text-white px-3 py-2 text-left">
                {verEventos ? "Ocultar eventos" : `Ver los ${estado.eventos.length} eventos que se envían`}
              </button>
            </div>

            {verEventos && (
              <ul className="divide-y divide-gray-800 rounded-lg border border-gray-800">
                {estado.eventos.map((e) => (
                  <li key={e.evento} className="px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <code className="text-[#00C0E7] text-xs sm:w-48 shrink-0">{e.evento}</code>
                    <span className="text-gray-400 text-sm">{e.descripcion}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
