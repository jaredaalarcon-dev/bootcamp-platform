// src/app/profile/page.tsx
// "Mi perfil": datos de la cuenta y datos que saldrán en el certificado
// (nombre completo como en el documento, documento de identidad y foto formal).
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { StudentLayout } from "@/components/ui/StudentLayout";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { certificatesApi, CertificateProfile, TipoDocumento, TIPOS_DOC } from "@/hooks/useCertificatesApi";
import { enlaceWhatsApp, WHATSAPP_VISIBLE } from "@/lib/social";

const FOTO_MAX_MB = 3;

// Recorta la foto al centro en formato 3:4 (tipo carné) y la comprime a JPG.
// Así todas las fotos se ven iguales en el certificado y pesan poco.
async function prepararFoto(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error("No se pudo leer la imagen"));
      i.src = url;
    });
    const objetivo = 3 / 4;
    let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (sw / sh > objetivo) { const w = sh * objetivo; sx = (sw - w) / 2; sw = w; }
    else { const h = sw / objetivo; sy = Math.max(0, (sh - h) * 0.35); sh = h; }
    const W = Math.min(600, Math.round(sw)), H = Math.round(W / objetivo);
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.9));
    return blob ? new File([blob], "foto-formal.jpg", { type: "image/jpeg" }) : file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const Check = ({ ok }: { ok: boolean }) => (
  <span className={`inline-flex w-5 h-5 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${ok ? "bg-[#00C0E7] text-[#0d0d0d]" : "bg-gray-800 text-gray-500"}`}>
    {ok ? "✓" : "•"}
  </span>
);

export default function ProfilePage() {
  const router = useRouter();
  const { getToken, getUser } = useAuth();
  const [perfil, setPerfil] = useState<CertificateProfile | null>(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ fullName: "", documentType: "DNI" as TipoDocumento, documentNumber: "" });
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [usuario, setUsuario] = useState<ReturnType<typeof getUser>>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    setUsuario(getUser());
    certificatesApi.getProfile()
      .then((p) => {
        setPerfil(p);
        setForm({ fullName: p.fullName || p.suggestedName, documentType: p.documentType, documentNumber: p.documentNumber });
      })
      .catch(() => setAviso({ tipo: "error", texto: "No se pudieron cargar tus datos. Recarga la página." }))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true); setAviso(null);
    const r = await certificatesApi.saveProfile(form);
    setGuardando(false);
    if (r.ok) { setPerfil(r.data); setAviso({ tipo: "ok", texto: "Datos guardados." }); }
    else setAviso({ tipo: "error", texto: r.error });
  };

  const elegirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAviso({ tipo: "error", texto: "La foto debe ser JPG, PNG o WEBP." }); return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setAviso({ tipo: "error", texto: "La imagen es demasiado pesada (máx. 12 MB antes de optimizar)." }); return;
    }
    setSubiendo(true); setAviso(null);
    try {
      const lista = await prepararFoto(file);
      if (lista.size > FOTO_MAX_MB * 1024 * 1024) throw new Error(`La foto supera ${FOTO_MAX_MB} MB`);
      const r = await certificatesApi.uploadPhoto(lista);
      if (r.ok) { setPerfil(r.data); setAviso({ tipo: "ok", texto: "Foto actualizada." }); }
      else setAviso({ tipo: "error", texto: r.error });
    } catch (err) {
      setAviso({ tipo: "error", texto: (err as Error).message || "No se pudo procesar la foto" });
    } finally {
      setSubiendo(false);
    }
  };

  const quitarFoto = async () => {
    setSubiendo(true);
    try { setPerfil(await certificatesApi.deletePhoto()); } finally { setSubiendo(false); }
  };

  const datosGuardados = Boolean(perfil?.fullName && perfil?.documentNumber);
  const tieneFoto = Boolean(perfil?.photoUrl);
  const iniciales = (usuario?.firstName?.[0] ?? usuario?.email?.[0] ?? "U").toUpperCase();

  return (
    <StudentLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Mi perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Tu cuenta y los datos que aparecerán en tu certificado</p>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20"><div className="spinner-cyan" /></div>
        ) : (
          <>
            {/* ── Cuenta ─────────────────────────────────────────────── */}
            <section className="card-dark p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#00C0E7] text-[#0d0d0d] font-brand text-2xl flex items-center justify-center shrink-0">
                {iniciales}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold truncate">
                  {[usuario?.firstName, usuario?.lastName].filter(Boolean).join(" ") || "Estudiante"}
                </p>
                <p className="text-gray-500 text-sm truncate">{perfil?.email || usuario?.email}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check ok={Boolean(perfil?.complete)} />
                <span className={perfil?.complete ? "text-[#00C0E7] font-semibold" : "text-gray-400"}>
                  {perfil?.complete ? "Listo para tu certificado" : "Faltan datos para tu certificado"}
                </span>
              </div>
            </section>

            {aviso && (
              <div
                role="status"
                className={`rounded-lg px-4 py-3 text-sm border ${aviso.tipo === "ok" ? "border-[#00C0E7]/40 text-[#00C0E7] bg-[#00C0E7]/5" : "border-[#E31E24]/40 text-[#E31E24] bg-[#E31E24]/5"}`}
              >
                {aviso.texto}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              {/* ── Datos para el certificado ─────────────────────────── */}
              <form onSubmit={guardar} className="card-dark p-5 space-y-4">
                <div>
                  <h2 className="font-brand text-white text-lg uppercase tracking-wide">Datos para tu certificado</h2>
                  <div className="h-[2px] w-10 bg-[#E31E24] rounded mt-1" />
                  <p className="text-gray-500 text-xs mt-2">
                    Escríbelos tal como figuran en tu documento de identidad. Saldrán impresos en tu certificado y constancias.
                  </p>
                </div>

                <div>
                  <label htmlFor="fullName" className="label-dark">Nombres y apellidos completos</label>
                  <input
                    id="fullName"
                    className="input-dark"
                    value={form.fullName}
                    maxLength={150}
                    required
                    placeholder="Ej.: María Fernanda Quispe Rojas"
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                  <div>
                    <label htmlFor="docType" className="label-dark">Documento</label>
                    <select
                      id="docType"
                      className="input-dark"
                      value={form.documentType}
                      onChange={(e) => setForm({ ...form, documentType: e.target.value as TipoDocumento })}
                    >
                      {TIPOS_DOC.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="docNum" className="label-dark">Número de documento</label>
                    <input
                      id="docNum"
                      className="input-dark font-mono"
                      value={form.documentNumber}
                      required
                      maxLength={20}
                      inputMode={form.documentType === "PASAPORTE" ? "text" : "numeric"}
                      placeholder={form.documentType === "DNI" ? "8 dígitos" : ""}
                      onChange={(e) => setForm({ ...form, documentNumber: e.target.value.replace(/\s/g, "").toUpperCase() })}
                    />
                  </div>
                </div>

                <p className="text-gray-500 text-xs">
                  En la verificación pública del certificado solo se muestran los últimos 4 dígitos de tu documento.{" "}
                  <Link href="/privacidad" className="text-[#00C0E7] hover:underline">Política de privacidad</Link>
                </p>

                <div className="flex justify-end">
                  <button type="submit" disabled={guardando} className="btn-red text-sm px-6 py-2.5">
                    {guardando ? "Guardando…" : datosGuardados ? "Actualizar datos" : "Guardar datos"}
                  </button>
                </div>
              </form>

              {/* ── Foto formal ───────────────────────────────────────── */}
              <section className="card-dark p-5 flex flex-col">
                <h2 className="font-brand text-white text-lg uppercase tracking-wide">Foto formal</h2>
                <div className="h-[2px] w-10 bg-[#E31E24] rounded mt-1 mb-4" />

                <div className="mx-auto w-40 aspect-[3/4] rounded-lg overflow-hidden border-2 border-dashed border-gray-700 bg-gray-900 flex items-center justify-center relative">
                  {tieneFoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={perfil!.photoUrl!} alt="Tu foto formal" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.68 0-5.22-.58-7.5-1.65z" />
                    </svg>
                  )}
                  {subiendo && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="spinner-cyan" /></div>
                  )}
                </div>

                <input ref={archivoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={elegirFoto} />
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    disabled={subiendo || !datosGuardados}
                    onClick={() => archivoRef.current?.click()}
                    className="btn-cyan flex-1 text-sm py-2"
                    title={!datosGuardados ? "Primero guarda tu nombre y documento" : undefined}
                  >
                    {tieneFoto ? "Cambiar foto" : "Subir foto"}
                  </button>
                  {tieneFoto && (
                    <button type="button" disabled={subiendo} onClick={quitarFoto} className="text-sm px-3 text-gray-400 hover:text-[#E31E24]">
                      Quitar
                    </button>
                  )}
                </div>
                {!datosGuardados && <p className="text-gray-500 text-xs mt-2 text-center">Primero guarda tus datos.</p>}

                <ul className="mt-4 space-y-1.5 text-xs text-gray-400">
                  <li>• De frente, fondo claro y liso.</li>
                  <li>• Rostro visible: sin lentes oscuros ni gorra.</li>
                  <li>• Buena iluminación, sin filtros.</li>
                  <li>• JPG, PNG o WEBP. Se recorta sola a formato carné.</li>
                </ul>
              </section>
            </div>

            {/* ── Cómo obtener el certificado ───────────────────────────── */}
            <section className="card-dark p-5">
              <h2 className="font-brand text-white text-lg uppercase tracking-wide">¿Constancia o certificado?</h2>
              <div className="h-[2px] w-10 bg-[#E31E24] rounded mt-1 mb-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-800 p-4">
                  <p className="text-[#00C0E7] text-xs font-bold uppercase tracking-wider">Gratis</p>
                  <p className="text-white font-semibold mt-1">Constancia de culminación</p>
                  <p className="text-gray-400 text-sm mt-1">Se descarga al completar el 100 % del curso. No necesitas pagar.</p>
                </div>
                <div className="rounded-lg border border-[#E31E24]/40 p-4">
                  <p className="text-[#E31E24] text-xs font-bold uppercase tracking-wider">Con pago</p>
                  <p className="text-white font-semibold mt-1">Certificado oficial</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Con tu foto y documento. Lo solicitas por WhatsApp; cuando confirmamos el pago, se habilita en «Certificados».
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <a
                  href={enlaceWhatsApp("Hola, quiero información para obtener mi certificado oficial del Bootcamp SIJB.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="keep-theme inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#0d0d0d] hover:brightness-110"
                >
                  <SocialIcon red="whatsapp" className="w-4 h-4" />
                  Consultar por WhatsApp
                </a>
                <span className="text-gray-500 text-sm">{WHATSAPP_VISIBLE}</span>
                <Link href="/certificates" className="ml-auto text-sm font-semibold text-[#00C0E7] hover:underline">Ir a mis certificados →</Link>
              </div>
            </section>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
