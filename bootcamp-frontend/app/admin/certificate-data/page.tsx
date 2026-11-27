// src/app/admin/certificate-data/page.tsx
// Datos que cada alumno registró en «Mi perfil» para su constancia y certificado.
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { certificateDataAdminApi, DatoCertificadoAdmin } from "@/hooks/useCertificatesApi";

type Filtro = "todos" | "con_datos" | "sin_datos" | "con_foto";
type Borrado = { a: DatoCertificadoAdmin; que: "foto" | "datos" };
const MOTIVOS: Record<Borrado["que"], string[]> = {
  foto: ["No es una foto formal", "La foto está borrosa", "No se ve bien el rostro", "Es la foto de otra persona"],
  datos: ["El nombre está mal escrito", "El documento es incorrecto", "Los datos no son reales"],
};
const card = "bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl";
const fecha = (d: string | null) => (d ? new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const nombreDoc = (t: string | null) => (t === "CE" ? "C.E." : t === "PASAPORTE" ? "Pasaporte" : t ?? "");

function Estado({ a }: { a: DatoCertificadoAdmin }) {
  if (a.complete) return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-400">✓ Completo</span>;
  if (a.basic) return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-[rgba(0,192,231,0.12)] text-[#00C0E7]">Falta foto</span>;
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-[rgba(227,30,36,0.12)] text-[#E31E24]">Sin datos</span>;
}

function Foto({ a, onAbrir }: { a: DatoCertificadoAdmin; onAbrir: (a: DatoCertificadoAdmin) => void }) {
  if (a.photoUrl) return (
    <button onClick={() => onAbrir(a)} className="block w-10 h-[52px] shrink-0 rounded overflow-hidden ring-1 ring-[#00C0E7]/40 hover:ring-2" aria-label={`Ver foto de ${a.fullName ?? a.accountName}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.photoUrl} alt="" className="w-full h-full object-cover" />
    </button>
  );
  return (
    <span className="flex w-10 h-[52px] shrink-0 items-center justify-center rounded bg-gray-800 text-gray-500 font-brand text-lg">
      {(a.fullName ?? a.accountName)[0]?.toUpperCase()}
    </span>
  );
}

// Botones para borrar lo que el alumno registró mal
function Acciones({ a, onBorrar, compacto = false }: { a: DatoCertificadoAdmin; onBorrar: (b: Borrado) => void; compacto?: boolean }) {
  if (!a.fullName && !a.hasPhoto) return null;
  const base = "inline-flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap";
  const tam = compacto ? "px-2.5 py-1.5" : "px-2.5 py-1";
  return (
    <div className="flex flex-wrap gap-2">
      {a.hasPhoto && (
        <button onClick={() => onBorrar({ a, que: "foto" })} className={`${base} ${tam} border-amber-500/30 text-amber-400 hover:bg-amber-500/10`} title="Borrar solo la foto">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zM4 4l16 16" /></svg>
          Borrar foto
        </button>
      )}
      <button onClick={() => onBorrar({ a, que: "datos" })} className={`${base} ${tam} border-[#E31E24]/35 text-[#E31E24] hover:bg-[#E31E24]/10`} title="Borrar nombre, documento y foto">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Borrar datos
      </button>
    </div>
  );
}

export default function AdminCertificateDataPage() {
  const [datos, setDatos] = useState<{ total: number; conDatos: number; conFoto: number; items: DatoCertificadoAdmin[] } | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [buscar, setBuscar] = useState("");
  const [foto, setFoto] = useState<DatoCertificadoAdmin | null>(null);
  const [borrado, setBorrado] = useState<Borrado | null>(null);
  const [motivo, setMotivo] = useState("");
  const [borrando, setBorrando] = useState(false);

  const pedirBorrado = (b: Borrado) => { setFoto(null); setMotivo(""); setBorrado(b); };

  const confirmarBorrado = async () => {
    if (!borrado) return;
    const { a, que } = borrado;
    setBorrando(true);
    try {
      if (que === "foto") await certificateDataAdminApi.borrarFoto(a.userId, motivo.trim());
      else await certificateDataAdminApi.borrarDatos(a.userId, motivo.trim());
      // Actualiza la lista sin recargar
      setDatos((d) => {
        if (!d) return d;
        const items = d.items.map((x) => {
          if (x.userId !== a.userId) return x;
          return que === "foto"
            ? { ...x, photoUrl: null, hasPhoto: false, complete: false }
            : { ...x, fullName: null, documentType: null, documentNumber: null, photoUrl: null, hasPhoto: false, basic: false, complete: false, updatedAt: null };
        });
        return { ...d, items, conDatos: items.filter((i) => i.basic).length, conFoto: items.filter((i) => i.complete).length };
      });
      toast.success(que === "foto" ? "Foto borrada. Se avisó al alumno para que suba otra." : "Datos borrados. Se avisó al alumno para que los registre de nuevo.");
      setBorrado(null);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "No se pudo borrar");
    } finally {
      setBorrando(false);
    }
  };

  useEffect(() => {
    certificateDataAdminApi.list().then(setDatos).catch(() => { setDatos({ total: 0, conDatos: 0, conFoto: 0, items: [] }); toast.error("No se pudieron cargar los datos"); });
  }, []);

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return (datos?.items ?? []).filter((a) => {
      if (filtro === "con_datos" && !a.basic) return false;
      if (filtro === "sin_datos" && a.basic) return false;
      if (filtro === "con_foto" && !a.complete) return false;
      if (!q) return true;
      return [a.fullName, a.accountName, a.email, a.documentNumber].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [datos, filtro, buscar]);

  const exportar = () => {
    const filas = [["Nombre completo (documento)", "Tipo de documento", "Número", "Foto", "Cuenta", "Correo", "Cursos completados", "Constancias", "Certificados", "Actualizado"]];
    visibles.forEach((a) => filas.push([a.fullName ?? "", nombreDoc(a.documentType), a.documentNumber ?? "", a.hasPhoto ? "Sí" : "No", a.accountName, a.email, String(a.completedCourses), String(a.constancias), String(a.certificados), fecha(a.updatedAt)]));
    const csv = "﻿" + filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `datos-certificados-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Datos para certificados</h1>
          <p className="text-gray-500 text-sm mt-1">Lo que cada alumno registró en «Mi perfil». Nombre y documento son obligatorios para la constancia; el certificado oficial además lleva foto.</p>
        </div>
        <button onClick={exportar} disabled={!visibles.length} className="btn-cyan text-sm px-4 py-2 shrink-0 disabled:opacity-40">⬇ Exportar Excel (CSV)</button>
      </div>

      {datos && (
        <div className="grid grid-cols-3 gap-3">
          {[["Alumnos", datos.total], ["Con datos", datos.conDatos], ["Con foto", datos.conFoto]].map(([t, v]) => (
            <div key={t as string} className={`${card} p-3 sm:p-4`}>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-gray-500">{t}</p>
              <p className="font-brand text-[#00C0E7] text-xl sm:text-2xl mt-1">{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre, correo o documento" aria-label="Buscar alumno" className="input-dark text-sm sm:flex-1" />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {([["todos", "Todos"], ["con_datos", "Con datos"], ["sin_datos", "Sin datos"], ["con_foto", "Con foto"]] as [Filtro, string][]).map(([k, t]) => (
            <button key={k} onClick={() => setFiltro(k)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                filtro === k ? "bg-[rgba(0,192,231,0.15)] border-[#00C0E7]/50 text-[#00C0E7]" : "border-gray-800 text-gray-400 hover:text-white"
              }`}>{t}</button>
          ))}
        </div>
      </div>

      {datos === null ? (
        <div className="flex justify-center py-16"><div className="spinner-cyan" /></div>
      ) : visibles.length === 0 ? (
        <div className={`${card} p-10 text-center`}><p className="text-gray-400 text-sm">No hay alumnos con ese filtro.</p></div>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className={`${card} hidden md:block overflow-hidden`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-800">
                  <th className="px-4 py-3">Alumno</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-center">Completados</th><th className="px-4 py-3 text-center">Emitidos</th><th className="px-4 py-3">Actualizado</th><th className="px-4 py-3 text-right">Corregir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {visibles.map((a) => (
                  <tr key={a.userId} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Foto a={a} onAbrir={setFoto} />
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{a.fullName ?? <span className="text-gray-500 font-normal italic">Sin nombre registrado</span>}</p>
                          <p className="text-gray-500 text-xs truncate">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{a.documentNumber ? `${nombreDoc(a.documentType)} ${a.documentNumber}` : "—"}</td>
                    <td className="px-4 py-3"><Estado a={a} /></td>
                    <td className="px-4 py-3 text-center text-gray-300">{a.completedCourses}</td>
                    <td className="px-4 py-3 text-center text-gray-300 text-xs">{a.constancias} const. · {a.certificados} cert.</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fecha(a.updatedAt)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end"><Acciones a={a} onBorrar={pedirBorrado} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="md:hidden space-y-3">
            {visibles.map((a) => (
              <li key={a.userId} className={`${card} p-4 flex gap-3`}>
                <Foto a={a} onAbrir={setFoto} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-semibold text-sm leading-snug break-words">{a.fullName ?? <span className="text-gray-500 font-normal italic">Sin nombre registrado</span>}</p>
                    <Estado a={a} />
                  </div>
                  <p className="text-gray-500 text-xs truncate">{a.email}</p>
                  <p className="text-gray-300 text-xs mt-1.5">{a.documentNumber ? `${nombreDoc(a.documentType)} ${a.documentNumber}` : "Sin documento"}</p>
                  <p className="text-gray-500 text-[11px] mt-1">{a.completedCourses} cursos completados · {a.constancias} constancias · {a.certificados} certificados</p>
                  {(a.fullName || a.hasPhoto) && <div className="mt-3"><Acciones a={a} onBorrar={pedirBorrado} compacto /></div>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {foto?.photoUrl && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70" onClick={() => setFoto(null)} role="dialog" aria-modal="true">
          <div className="card-dark p-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto.photoUrl} alt={`Foto de ${foto.fullName ?? foto.accountName}`} className="w-full aspect-[3/4] object-cover rounded-lg" />
            <p className="text-white font-semibold mt-3">{foto.fullName}</p>
            <p className="text-gray-500 text-xs">{nombreDoc(foto.documentType)} {foto.documentNumber}</p>
            <div className="flex gap-2 justify-center mt-3">
              <button onClick={() => pedirBorrado({ a: foto, que: "foto" })} className="rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm font-semibold px-4 py-1.5">Borrar foto</button>
              <button onClick={() => setFoto(null)} className="btn-cyan text-sm px-5 py-1.5">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {borrado && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70" onClick={() => !borrando && setBorrado(null)} role="dialog" aria-modal="true" aria-labelledby="titulo-borrar">
          <div className="card-dark w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className={`flex w-10 h-10 shrink-0 items-center justify-center rounded-full ${borrado.que === "foto" ? "bg-amber-500/10 text-amber-400" : "bg-[#E31E24]/10 text-[#E31E24]"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </span>
              <div className="min-w-0">
                <h2 id="titulo-borrar" className="text-white font-bold">{borrado.que === "foto" ? "¿Borrar la foto?" : "¿Borrar todos los datos?"}</h2>
                <p className="text-gray-400 text-sm mt-1 break-words">
                  {borrado.que === "foto"
                    ? <>Se borrará la foto de <b className="text-gray-200">{borrado.a.fullName ?? borrado.a.accountName}</b>. Su nombre y documento se mantienen.</>
                    : <>Se borrará el nombre, el documento y la foto de <b className="text-gray-200">{borrado.a.fullName ?? borrado.a.accountName}</b> ({borrado.a.email}).</>}
                </p>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-4">El alumno recibirá un aviso para {borrado.que === "foto" ? "subir una foto nueva" : "registrar sus datos otra vez"} en «Mi perfil». No se puede deshacer.</p>

            <label htmlFor="motivo-borrar" className="block text-xs font-semibold text-gray-300 mt-4 mb-1.5">Motivo (opcional, el alumno lo verá)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MOTIVOS[borrado.que].map((m) => (
                <button key={m} type="button" onClick={() => setMotivo(m)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${motivo === m ? "border-[#00C0E7]/60 bg-[rgba(0,192,231,0.12)] text-[#00C0E7]" : "border-gray-700 text-gray-400 hover:text-white"}`}>{m}</button>
              ))}
            </div>
            <textarea id="motivo-borrar" value={motivo} onChange={(e) => setMotivo(e.target.value.slice(0, 200))} rows={2} placeholder={borrado.que === "foto" ? "Ej.: la foto tiene fondo de colores" : "Ej.: faltó el segundo apellido"} className="input-dark text-sm w-full resize-none" />
            <p className="text-right text-[10px] text-gray-600">{motivo.length}/200</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setBorrado(null)} disabled={borrando} className="rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5 text-sm font-semibold py-2.5 disabled:opacity-50">Cancelar</button>
              <button onClick={confirmarBorrado} disabled={borrando} className="btn-red text-sm py-2.5 disabled:opacity-60">{borrando ? "Borrando…" : borrado.que === "foto" ? "Sí, borrar foto" : "Sí, borrar datos"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
