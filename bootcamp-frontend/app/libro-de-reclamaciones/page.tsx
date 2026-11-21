// src/app/libro-de-reclamaciones/page.tsx
// Libro de Reclamaciones virtual (Código de Protección y Defensa del Consumidor,
// D.S. 011-2011-PCM y modificatorias). Página pública.
"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { EMPRESA } from "@/lib/legal";
import { complaintsApi, HojaReclamo, NuevaHoja } from "@/hooks/useComplaintsApi";

const fecha = (d: string) => new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });

const INICIAL: NuevaHoja = {
  fullName: "",
  documentType: "DNI",
  documentNumber: "",
  address: "",
  phone: "",
  email: "",
  isMinor: false,
  guardianName: "",
  itemType: "servicio",
  amount: null,
  itemDescription: "",
  type: "reclamo",
  detail: "",
  request: "",
  accepted: false,
};

function Seccion({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="card-dark p-5 space-y-4">
      <legend className="sr-only">{titulo}</legend>
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-[#E31E24] text-white text-sm font-bold flex items-center justify-center" aria-hidden="true">{n}</span>
        <h2 className="font-brand text-white text-lg uppercase tracking-wide">{titulo}</h2>
      </div>
      {children}
    </fieldset>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor?: string | number | null }) {
  if (valor == null || valor === "") return null;
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 py-1.5 border-b border-gray-800 text-sm">
      <dt className="text-gray-500">{etiqueta}</dt>
      <dd className="text-white whitespace-pre-line break-words">{valor}</dd>
    </div>
  );
}

export default function LibroReclamacionesPage() {
  const [f, setF] = useState<NuevaHoja>(INICIAL);
  const [monto, setMonto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoja, setHoja] = useState<HojaReclamo | null>(null);
  const [consulta, setConsulta] = useState({ codigo: "", documento: "" });
  const [resultado, setResultado] = useState<{ ok: boolean; hoja?: HojaReclamo; error?: string } | null>(null);
  const hoy = new Date().toISOString();

  const cambiar = <K extends keyof NuevaHoja>(k: K, v: NuevaHoja[K]) => setF((x) => ({ ...x, [k]: v }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const montoNum = monto.trim() ? Number(monto.replace(",", ".")) : null;
    if (montoNum != null && (Number.isNaN(montoNum) || montoNum < 0)) {
      setError("El monto reclamado no es válido.");
      return;
    }
    setEnviando(true);
    const r = await complaintsApi.create({ ...f, amount: montoNum, guardianName: f.isMinor ? f.guardianName : undefined });
    setEnviando(false);
    if (r.ok) {
      setHoja(r.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(r.error);
    }
  };

  const consultar = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await complaintsApi.consultar(consulta.codigo, consulta.documento);
    setResultado(r.ok ? { ok: true, hoja: r.data } : { ok: false, error: r.error });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <header className="border-b border-[rgba(0,192,231,0.12)] bg-[#111827] print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" aria-label="Ir al inicio"><BrandLogo width={170} /></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center">
          <h1 className="font-brand text-[#00C0E7] text-3xl uppercase tracking-wide">Libro de Reclamaciones</h1>
          <p className="text-gray-400 text-sm mt-1">Hoja de reclamación virtual</p>
        </div>

        {/* Datos del proveedor */}
        <section className="card-dark p-5 text-sm grid gap-1 sm:grid-cols-2">
          <p><span className="text-gray-500">Proveedor: </span><span className="text-white">{EMPRESA.titular}</span></p>
          <p><span className="text-gray-500">RUC: </span><span className="text-white">{EMPRESA.ruc}</span></p>
          <p><span className="text-gray-500">Nombre comercial: </span><span className="text-white">{EMPRESA.nombreComercial}</span></p>
          <p><span className="text-gray-500">Fecha: </span><span className="text-white">{fecha(hoja?.createdAt ?? hoy)}</span></p>
          <p className="sm:col-span-2"><span className="text-gray-500">Domicilio: </span><span className="text-white">{EMPRESA.direccion}</span></p>
        </section>

        {hoja ? (
          /* ── Constancia de la hoja registrada ── */
          <section className="card-dark p-6 border-t-4 border-t-[#00C0E7]" aria-live="polite">
            <p className="text-[#00C0E7] font-bold uppercase tracking-wider text-xs">Hoja registrada</p>
            <h2 className="text-white text-2xl font-semibold mt-1">N.° {hoja.code}</h2>
            <p className="text-gray-400 text-sm mt-2">
              Guarda este número. Te responderemos al correo <b className="text-white">{hoja.email}</b> a más tardar el{" "}
              <b className="text-white">{fecha(hoja.deadline)}</b> (15 días hábiles). Puedes imprimir o guardar esta hoja como PDF.
            </p>
            <dl className="mt-5">
              <Fila etiqueta="Tipo" valor={hoja.type === "reclamo" ? "Reclamo" : "Queja"} />
              <Fila etiqueta="Consumidor" valor={hoja.fullName} />
              <Fila etiqueta="Documento" valor={`${hoja.documentType} ${hoja.documentNumber}`} />
              <Fila etiqueta="Domicilio" valor={hoja.address} />
              <Fila etiqueta="Teléfono" valor={hoja.phone} />
              <Fila etiqueta="Correo" valor={hoja.email} />
              <Fila etiqueta="Padre/madre o apoderado" valor={hoja.guardianName} />
              <Fila etiqueta="Bien contratado" valor={hoja.itemType === "servicio" ? "Servicio" : "Producto"} />
              <Fila etiqueta="Monto reclamado" valor={hoja.amount != null ? `S/ ${hoja.amount.toFixed(2)}` : null} />
              <Fila etiqueta="Descripción" valor={hoja.itemDescription} />
              <Fila etiqueta="Detalle" valor={hoja.detail} />
              <Fila etiqueta="Pedido" valor={hoja.request} />
            </dl>
            <div className="flex flex-wrap gap-3 mt-6 print:hidden">
              <button onClick={() => window.print()} className="btn-red text-sm px-5 py-2.5">Imprimir o guardar PDF</button>
              <button onClick={() => { setHoja(null); setF(INICIAL); setMonto(""); }} className="text-sm text-gray-400 hover:text-white px-3">
                Registrar otra hoja
              </button>
            </div>
          </section>
        ) : (
          /* ── Formulario ── */
          <form onSubmit={enviar} className="space-y-6">
            <Seccion n={1} titulo="Tus datos">
              <div>
                <label htmlFor="lr-nombre" className="label-dark">Nombres y apellidos *</label>
                <input id="lr-nombre" className="input-dark" required maxLength={150} autoComplete="name"
                  value={f.fullName} onChange={(e) => cambiar("fullName", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                <div>
                  <label htmlFor="lr-tdoc" className="label-dark">Documento *</label>
                  <select id="lr-tdoc" className="input-dark" value={f.documentType} onChange={(e) => cambiar("documentType", e.target.value)}>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné de extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="lr-ndoc" className="label-dark">Número *</label>
                  <input id="lr-ndoc" className="input-dark font-mono" required maxLength={20}
                    value={f.documentNumber} onChange={(e) => cambiar("documentNumber", e.target.value.replace(/\s/g, "").toUpperCase())} />
                </div>
              </div>
              <div>
                <label htmlFor="lr-dir" className="label-dark">Domicilio *</label>
                <input id="lr-dir" className="input-dark" required maxLength={250} autoComplete="street-address"
                  value={f.address} onChange={(e) => cambiar("address", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="lr-tel" className="label-dark">Teléfono *</label>
                  <input id="lr-tel" className="input-dark" required inputMode="tel" maxLength={20} autoComplete="tel"
                    value={f.phone} onChange={(e) => cambiar("phone", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="lr-mail" className="label-dark">Correo electrónico *</label>
                  <input id="lr-mail" type="email" className="input-dark" required maxLength={150} autoComplete="email"
                    value={f.email} onChange={(e) => cambiar("email", e.target.value)} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" className="accent-[#00C0E7] w-4 h-4" checked={f.isMinor} onChange={(e) => cambiar("isMinor", e.target.checked)} />
                Soy menor de edad
              </label>
              {f.isMinor && (
                <div>
                  <label htmlFor="lr-apod" className="label-dark">Nombre del padre, madre o apoderado *</label>
                  <input id="lr-apod" className="input-dark" required maxLength={150}
                    value={f.guardianName} onChange={(e) => cambiar("guardianName", e.target.value)} />
                </div>
              )}
            </Seccion>

            <Seccion n={2} titulo="Bien contratado">
              <div className="flex flex-wrap gap-4 text-sm text-gray-300" role="radiogroup" aria-label="Tipo de bien">
                {(["servicio", "producto"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <input type="radio" name="itemType" className="accent-[#00C0E7] w-4 h-4" checked={f.itemType === t} onChange={() => cambiar("itemType", t)} />
                    {t === "servicio" ? "Servicio (curso, certificado)" : "Producto"}
                  </label>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div>
                  <label htmlFor="lr-desc" className="label-dark">Descripción *</label>
                  <input id="lr-desc" className="input-dark" required maxLength={1000} placeholder="Ej.: Certificado del curso de Laravel"
                    value={f.itemDescription} onChange={(e) => cambiar("itemDescription", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="lr-monto" className="label-dark">Monto reclamado (S/)</label>
                  <input id="lr-monto" className="input-dark" inputMode="decimal" placeholder="Opcional"
                    value={monto} onChange={(e) => setMonto(e.target.value)} />
                </div>
              </div>
            </Seccion>

            <Seccion n={3} titulo="Detalle de la reclamación">
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de reclamación">
                {([
                  ["reclamo", "Reclamo", "Disconformidad relacionada con los productos o servicios."],
                  ["queja", "Queja", "Disconformidad no relacionada con los productos o servicios, o malestar respecto a la atención al público."],
                ] as const).map(([v, t, d]) => (
                  <label key={v} className={`rounded-lg border p-3 cursor-pointer ${f.type === v ? "border-[#00C0E7] bg-[rgba(0,192,231,0.06)]" : "border-gray-700"}`}>
                    <span className="flex items-center gap-2 text-white font-semibold text-sm">
                      <input type="radio" name="type" className="accent-[#00C0E7] w-4 h-4" checked={f.type === v} onChange={() => cambiar("type", v)} />
                      {t}
                    </span>
                    <span className="block text-gray-400 text-xs mt-1">{d}</span>
                  </label>
                ))}
              </div>
              <div>
                <label htmlFor="lr-det" className="label-dark">Detalle *</label>
                <textarea id="lr-det" className="input-dark" rows={5} required maxLength={3000} placeholder="Cuéntanos qué pasó, con fechas si las tienes."
                  value={f.detail} onChange={(e) => cambiar("detail", e.target.value)} />
              </div>
              <div>
                <label htmlFor="lr-ped" className="label-dark">Pedido *</label>
                <textarea id="lr-ped" className="input-dark" rows={3} required maxLength={2000} placeholder="¿Qué solicitas que hagamos?"
                  value={f.request} onChange={(e) => cambiar("request", e.target.value)} />
              </div>
            </Seccion>

            <div className="card-dark p-5 space-y-3 text-xs text-gray-400">
              <p>• La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>
              <p>• El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles improrrogables, al correo que indiques.</p>
              <label className="flex items-start gap-2 text-sm text-gray-300 pt-2">
                <input type="checkbox" required className="accent-[#00C0E7] w-4 h-4 mt-0.5" checked={f.accepted} onChange={(e) => cambiar("accepted", e.target.checked)} />
                <span>
                  Declaro que los datos consignados son verdaderos y autorizo su uso para atender esta reclamación, según la{" "}
                  <Link href="/privacidad" className="text-[#00C0E7] hover:underline">Política de Privacidad</Link>.
                </span>
              </label>
            </div>

            {error && <p role="alert" className="rounded-lg border border-[#E31E24]/40 bg-[#E31E24]/5 px-4 py-3 text-sm text-[#E31E24]">{error}</p>}

            <div className="flex justify-end">
              <button type="submit" disabled={enviando} className="btn-red px-8 py-3 text-sm">
                {enviando ? "Registrando…" : "Registrar hoja de reclamación"}
              </button>
            </div>
          </form>
        )}

        {/* ── Consultar estado ── */}
        <section className="card-dark p-5 print:hidden">
          <h2 className="font-brand text-white text-lg uppercase tracking-wide">Consultar una hoja</h2>
          <p className="text-gray-500 text-xs mt-1">Ingresa el número de hoja y tu documento para ver si ya respondimos.</p>
          <form onSubmit={consultar} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] mt-4">
            <label className="sr-only" htmlFor="lr-cod">Número de hoja</label>
            <input id="lr-cod" className="input-dark font-mono uppercase" placeholder="LR-2026-000001" required
              value={consulta.codigo} onChange={(e) => setConsulta({ ...consulta, codigo: e.target.value })} />
            <label className="sr-only" htmlFor="lr-cdoc">Número de documento</label>
            <input id="lr-cdoc" className="input-dark font-mono" placeholder="N.° de documento" required
              value={consulta.documento} onChange={(e) => setConsulta({ ...consulta, documento: e.target.value })} />
            <button type="submit" className="btn-cyan px-5 py-2 text-sm">Consultar</button>
          </form>
          {resultado && (
            <div className="mt-4 text-sm" aria-live="polite">
              {resultado.ok && resultado.hoja ? (
                <div className="rounded-lg border border-gray-800 p-4 space-y-1">
                  <p className="text-white font-semibold">
                    {resultado.hoja.code} · {resultado.hoja.type === "reclamo" ? "Reclamo" : "Queja"} del {fecha(resultado.hoja.createdAt)}
                  </p>
                  {resultado.hoja.status === "respondido" ? (
                    <>
                      <p className="text-[#00C0E7] font-semibold">Respondido el {fecha(resultado.hoja.respondedAt!)}</p>
                      <p className="text-gray-300 whitespace-pre-line">{resultado.hoja.response}</p>
                    </>
                  ) : (
                    <p className="text-gray-400">En atención. Responderemos a más tardar el {fecha(resultado.hoja.deadline)}.</p>
                  )}
                </div>
              ) : (
                <p className="text-[#E31E24]">{resultado.error}</p>
              )}
            </div>
          )}
        </section>
      </main>

      <div className="print:hidden"><SiteFooter /></div>
    </div>
  );
}
