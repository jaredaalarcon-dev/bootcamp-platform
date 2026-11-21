// src/app/admin/complaints/page.tsx
// Libro de Reclamaciones: hojas recibidas, plazo de 15 días hábiles y respuesta.
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { complaintsApi, HojaReclamo } from "@/hooks/useComplaintsApi";
import { EMPRESA } from "@/lib/legal";

const card = "bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl";
const fecha = (d: string) => new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

// Días hábiles que faltan (lunes a viernes; no descuenta feriados)
function diasHabilesRestantes(limite: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(limite);
  fin.setHours(0, 0, 0, 0);
  if (fin < hoy) {
    let n = 0;
    const d = new Date(fin);
    while (d < hoy) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0) n++; }
    return -n;
  }
  let n = 0;
  const d = new Date(hoy);
  while (d < fin) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0) n++; }
  return n;
}

export default function AdminComplaintsPage() {
  const [hojas, setHojas] = useState<HojaReclamo[] | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "pendiente" | "respondido">("pendiente");
  const [abierta, setAbierta] = useState<HojaReclamo | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    complaintsApi.list().then(setHojas).catch(() => { setHojas([]); toast.error("No se pudo cargar el libro"); });
  }, []);

  const pendientes = useMemo(() => (hojas ?? []).filter((h) => h.status === "pendiente"), [hojas]);
  const vencidas = pendientes.filter((h) => diasHabilesRestantes(h.deadline) < 0).length;
  const visibles = (hojas ?? []).filter((h) => filtro === "todas" || h.status === filtro);

  const abrir = (h: HojaReclamo) => { setAbierta(h); setRespuesta(h.response ?? ""); };

  const guardar = async () => {
    if (!abierta?.id || !respuesta.trim()) return;
    setGuardando(true);
    try {
      const r = await complaintsApi.respond(abierta.id, respuesta.trim());
      setHojas((prev) => (prev ?? []).map((h) => (h.id === r.id ? { ...h, ...r } : h)));
      setAbierta({ ...abierta, ...r });
      toast.success("Respuesta registrada. Envíala también al correo del consumidor.");
    } catch {
      toast.error("No se pudo guardar la respuesta");
    } finally {
      setGuardando(false);
    }
  };

  const correo = (h: HojaReclamo) => {
    const asunto = `Respuesta a su ${h.type} N.° ${h.code} — ${EMPRESA.nombreComercial}`;
    const cuerpo = `Estimado(a) ${h.fullName}:\n\nEn atención a su ${h.type} N.° ${h.code}, registrada el ${fecha(h.createdAt)} en nuestro Libro de Reclamaciones, le informamos:\n\n${respuesta.trim()}\n\nAtentamente,\n${EMPRESA.nombreComercial}\n${EMPRESA.titular} · RUC ${EMPRESA.ruc}\n${EMPRESA.direccion}`;
    return `mailto:${h.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Libro de Reclamaciones</h1>
        <p className="text-gray-500 text-sm mt-1">
          Responde cada hoja en un plazo máximo de 15 días hábiles y envía la respuesta al correo del consumidor. El plazo mostrado no descuenta feriados.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { k: "Hojas recibidas", v: hojas?.length ?? 0, c: "#00C0E7" },
          { k: "Pendientes", v: pendientes.length, c: pendientes.length ? "#E31E24" : "#00C0E7" },
          { k: "Fuera de plazo", v: vencidas, c: vencidas ? "#E31E24" : "#00C0E7" },
        ].map((x) => (
          <div key={x.k} className={`${card} p-4`}>
            <p className="text-gray-500 text-xs uppercase tracking-wider">{x.k}</p>
            <p className="font-brand text-3xl mt-1" style={{ color: x.c }}>{x.v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["pendiente", "respondido", "todas"] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtro === f ? "bg-[#00C0E7] text-[#0d0d0d]" : "border border-gray-700 text-gray-400 hover:border-[#00C0E7]"}`}>
            {f === "pendiente" ? "Pendientes" : f === "respondido" ? "Respondidas" : "Todas"}
          </button>
        ))}
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["N.° de hoja", "Consumidor", "Tipo", "Recibida", "Plazo", ""].map((t, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[#00C0E7] font-brand text-xs uppercase tracking-wide">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!hojas ? (
                <tr><td colSpan={6} className="py-12 text-center"><div className="spinner-cyan mx-auto" /></td></tr>
              ) : visibles.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500">No hay hojas en esta vista.</td></tr>
              ) : visibles.map((h) => {
                const dias = diasHabilesRestantes(h.deadline);
                return (
                  <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-3 font-mono text-white">{h.code}</td>
                    <td className="px-5 py-3">
                      <p className="text-white">{h.fullName}</p>
                      <p className="text-gray-500 text-xs">{h.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-300 capitalize">{h.type}</td>
                    <td className="px-5 py-3 text-gray-400">{fecha(h.createdAt)}</td>
                    <td className="px-5 py-3">
                      {h.status === "respondido" ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-[rgba(0,192,231,0.15)] text-[#00C0E7]">Respondida</span>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${dias < 0 ? "bg-[rgba(231,30,36,0.15)] text-[#E31E24]" : dias <= 3 ? "bg-[rgba(234,179,8,0.15)] text-yellow-500" : "bg-gray-800 text-gray-300"}`}>
                          {dias < 0 ? `Vencida hace ${-dias} d` : `${dias} días hábiles`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => abrir(h)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#00C0E7] text-[#00C0E7] hover:bg-[rgba(0,192,231,0.1)]">
                        {h.status === "respondido" ? "Ver" : "Responder"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {abierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="lr-titulo">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111827] border border-[rgba(0,192,231,0.25)] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="lr-titulo" className="font-brand text-[#00C0E7] text-lg uppercase tracking-wide">Hoja N.° {abierta.code}</h2>
                <p className="text-gray-500 text-xs">
                  {abierta.type === "reclamo" ? "Reclamo" : "Queja"} · recibida el {fecha(abierta.createdAt)} · responder hasta el {fecha(abierta.deadline)}
                </p>
              </div>
              <button onClick={() => setAbierta(null)} className="text-gray-400 hover:text-white text-xl leading-none" aria-label="Cerrar">×</button>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
              {[
                ["Consumidor", abierta.fullName],
                ["Documento", `${abierta.documentType} ${abierta.documentNumber}`],
                ["Teléfono", abierta.phone],
                ["Correo", abierta.email],
                ["Domicilio", abierta.address],
                ["Apoderado", abierta.guardianName],
                ["Bien", `${abierta.itemType === "servicio" ? "Servicio" : "Producto"}: ${abierta.itemDescription}`],
                ["Monto", abierta.amount != null ? `S/ ${Number(abierta.amount).toFixed(2)}` : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-gray-500 text-xs uppercase tracking-wider">{k}</dt>
                  <dd className="text-white break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 space-y-3 text-sm">
              <div><p className="text-gray-500 text-xs uppercase tracking-wider">Detalle</p><p className="text-gray-300 whitespace-pre-line">{abierta.detail}</p></div>
              <div><p className="text-gray-500 text-xs uppercase tracking-wider">Pedido</p><p className="text-gray-300 whitespace-pre-line">{abierta.request}</p></div>
            </div>

            <label htmlFor="lr-resp" className="label-dark mt-5">Respuesta del proveedor</label>
            <textarea id="lr-resp" rows={6} className="input-dark" value={respuesta} onChange={(e) => setRespuesta(e.target.value)}
              placeholder="Explica las acciones tomadas y la solución ofrecida." />
            {abierta.respondedAt && <p className="text-xs text-gray-500 mt-1">Respondida el {fecha(abierta.respondedAt)}.</p>}

            <div className="flex flex-wrap justify-end gap-2 mt-5">
              <a
                href={respuesta.trim() ? correo(abierta) : undefined}
                aria-disabled={!respuesta.trim()}
                className={`px-4 py-2 text-sm rounded-lg border ${respuesta.trim() ? "border-gray-600 text-gray-200 hover:border-[#00C0E7]" : "border-gray-800 text-gray-600 pointer-events-none"}`}
              >
                Enviar por correo
              </a>
              <button disabled={guardando || !respuesta.trim()} onClick={guardar} className="btn-red px-5 py-2 text-sm">
                {guardando ? "Guardando…" : abierta.status === "respondido" ? "Actualizar respuesta" : "Registrar respuesta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
