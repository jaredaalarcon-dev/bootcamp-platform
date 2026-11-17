// src/app/admin/payments/page.tsx
// Pagos y certificados: el pago se coordina por WhatsApp y aquí se confirma.
// Con el pago confirmado, el alumno puede descargar su certificado oficial;
// sin pago, solo la constancia gratuita.
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAdminApi, PaymentRow } from "@/hooks/useAdminApi";

type Filtro = "todos" | "por_confirmar" | "pagados" | "listos";

const fecha = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function AdminPaymentsPage() {
  const { getPayments, setPayment, loading } = useAdminApi();
  const [filas, setFilas] = useState<PaymentRow[]>([]);
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [editando, setEditando] = useState<PaymentRow | null>(null);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    getPayments().then(setFilas).catch(() => toast.error("No se pudo cargar la lista"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totales = useMemo(() => ({
    pagados: filas.filter((f) => f.paid).length,
    // Terminaron el curso y aún no pagan: posibles certificados por cobrar
    listos: filas.filter((f) => f.percentage === 100 && !f.paid).length,
    emitidos: filas.filter((f) => f.certificateIssued).length,
  }), [filas]);

  const visibles = filas.filter((f) => {
    const q = buscar.trim().toLowerCase();
    const coincide = !q || f.studentName.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.courseTitle.toLowerCase().includes(q);
    const pasa =
      filtro === "todos" ||
      (filtro === "pagados" && f.paid) ||
      (filtro === "por_confirmar" && !f.paid) ||
      (filtro === "listos" && f.percentage === 100 && !f.paid);
    return coincide && pasa;
  });

  const abrir = (f: PaymentRow) => { setEditando(f); setNota(f.paymentNote ?? ""); };

  const guardar = async (pagado: boolean) => {
    if (!editando) return;
    setGuardando(true);
    try {
      const r = await setPayment(editando.enrollmentId, pagado, nota);
      setFilas((prev) => prev.map((f) => (f.enrollmentId === r.enrollmentId ? { ...f, ...r } : f)));
      toast.success(pagado ? "Pago confirmado: el certificado quedó habilitado" : "Pago desmarcado");
      setEditando(null);
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const FILTROS: { id: Filtro; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "listos", label: "Terminaron sin pagar" },
    { id: "por_confirmar", label: "Sin pago" },
    { id: "pagados", label: "Pagados" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Pagos y Certificados</h1>
        <p className="text-gray-500 text-sm mt-1">
          Confirma aquí los pagos coordinados por WhatsApp. Con el pago confirmado, el alumno descarga su certificado oficial; sin pago, solo la constancia gratuita.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pagos confirmados", valor: totales.pagados, color: "#00C0E7" },
          { label: "Terminaron sin pagar", valor: totales.listos, color: "#E31E24" },
          { label: "Certificados emitidos", valor: totales.emitidos, color: "#00C0E7" },
        ].map((k) => (
          <div key={k.label} className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider">{k.label}</p>
            <p className="font-brand text-3xl mt-1" style={{ color: k.color }}>{k.valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-4 flex flex-col lg:flex-row gap-3">
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por alumno, correo o curso…"
          className="flex-1 bg-[#0d0d0d] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C0E7]"
        />
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filtro === f.id ? "bg-[#00C0E7] text-[#0d0d0d]" : "border border-gray-700 text-gray-400 hover:border-[#00C0E7]"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Alumno", "Curso", "Avance", "Datos", "Pago", "Acción"].map((t, i) => (
                  <th key={t} className={`px-5 py-3 text-[#00C0E7] font-brand text-xs uppercase tracking-wide ${i < 2 ? "text-left" : "text-center"} ${i === 3 ? "hidden md:table-cell" : ""}`}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && filas.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center"><div className="spinner-cyan mx-auto" /></td></tr>
              ) : visibles.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500 text-sm">No hay inscripciones que coincidan</td></tr>
              ) : visibles.map((f) => (
                <tr key={f.enrollmentId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{f.studentName}</p>
                    <p className="text-gray-500 text-xs">{f.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-300 max-w-[240px]">
                    <p className="line-clamp-2">{f.courseTitle}</p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-bold ${f.percentage === 100 ? "text-[#00C0E7]" : "text-gray-400"}`}>{f.percentage}%</span>
                  </td>
                  <td className="px-5 py-3 text-center hidden md:table-cell">
                    <span
                      title={f.profileComplete ? "Registró nombre, documento y foto" : "Aún no registra sus datos para el certificado"}
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${f.profileComplete ? "bg-[rgba(0,192,231,0.1)] text-[#00C0E7]" : "bg-gray-800 text-gray-500"}`}
                    >
                      {f.profileComplete ? "Completos" : "Pendientes"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {f.paid ? (
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-[rgba(0,192,231,0.15)] text-[#00C0E7]">Pagado</span>
                        <p className="text-gray-500 text-[11px] mt-1">{fecha(f.paidAt)}</p>
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-[rgba(231,30,36,0.12)] text-[#E31E24]">Sin pago</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => abrir(f)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${f.paid ? "border-gray-700 text-gray-400 hover:border-[#E31E24] hover:text-[#E31E24]" : "border-[#00C0E7] text-[#00C0E7] hover:bg-[rgba(0,192,231,0.1)]"}`}
                    >
                      {f.paid ? "Editar" : "Confirmar pago"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-600">
          {visibles.length} de {filas.length} inscripciones
        </div>
      </div>

      {/* Ventana de confirmación */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="pago-titulo">
          <div className="w-full max-w-md bg-[#111827] border border-[rgba(0,192,231,0.25)] rounded-xl p-6">
            <h2 id="pago-titulo" className="font-brand text-[#00C0E7] text-lg uppercase tracking-wide">
              {editando.paid ? "Pago confirmado" : "Confirmar pago"}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              <b className="text-white">{editando.studentName}</b> · {editando.courseTitle}
            </p>
            {!editando.profileComplete && (
              <p className="text-xs text-[#E31E24] mt-2">
                El alumno aún no registra su nombre, documento y foto. Podrá descargar el certificado cuando los complete en «Mi perfil».
              </p>
            )}
            <label htmlFor="nota" className="label-dark mt-4">Nota interna (opcional)</label>
            <input
              id="nota"
              value={nota}
              maxLength={200}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej.: Yape 17/11, operación 123456"
              className="input-dark"
            />
            <p className="text-gray-600 text-[11px] mt-1">No escribas datos de tarjetas ni cuentas bancarias.</p>
            <div className="flex flex-wrap justify-end gap-2 mt-6">
              <button onClick={() => setEditando(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              {editando.paid ? (
                <>
                  <button disabled={guardando} onClick={() => guardar(false)} className="px-4 py-2 text-sm rounded-lg border border-[#E31E24] text-[#E31E24] hover:bg-[rgba(231,30,36,0.1)] disabled:opacity-50">
                    Quitar pago
                  </button>
                  <button disabled={guardando} onClick={() => guardar(true)} className="btn-red px-4 py-2 text-sm">Guardar nota</button>
                </>
              ) : (
                <button disabled={guardando} onClick={() => guardar(true)} className="btn-red px-4 py-2 text-sm">
                  {guardando ? "Guardando…" : "Confirmar pago"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
