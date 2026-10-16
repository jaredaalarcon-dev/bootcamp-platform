// src/components/admin/AdminResourcesManager.tsx
// Gestión de recursos de un curso (admin): subir archivos, agregar enlaces,
// editar, ordenar y eliminar.
"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  useResourcesApi,
  CourseResource,
  TipoRecurso,
  TIPOS_RECURSO,
  EXTENSIONES_RECURSO,
  MAX_RECURSO_MB,
} from "@/hooks/useResourcesApi";
import { ResourceIcon, etiquetaTipo, claseTipo, tamano } from "@/components/ui/ResourceIcon";

type Modo = "archivo" | "enlace";
const FORM_VACIO = { title: "", description: "", type: "guia" as TipoRecurso, externalUrl: "" };

export function AdminResourcesManager({ courseId }: { courseId: string }) {
  const { getByCourse, upload, createLink, update, remove, download } = useResourcesApi();
  const [recursos, setRecursos] = useState<CourseResource[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modo, setModo] = useState<Modo>("archivo");
  const [form, setForm] = useState(FORM_VACIO);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editando, setEditando] = useState<string | null>(null);
  const [edicion, setEdicion] = useState({ title: "", description: "", type: "guia" as TipoRecurso, externalUrl: "" });

  const cargar = async () => {
    const r = await getByCourse(courseId);
    if (!r.success) toast.error(r.error || "No se pudieron cargar los recursos");
    setRecursos(r.data);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // ── Archivo seleccionado ────────────────────────────────────────────────
  const elegirArchivo = (f: File | null | undefined) => {
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (!EXTENSIONES_RECURSO.split(",").includes(ext)) {
      toast.error("Formato no permitido. Usa PDF, Word, Excel, PowerPoint, ZIP, TXT o imágenes.");
      return;
    }
    if (f.size > MAX_RECURSO_MB * 1024 * 1024) {
      toast.error(`El archivo supera los ${MAX_RECURSO_MB} MB`);
      return;
    }
    setArchivo(f);
    // Si no hay título, se propone el nombre del archivo
    if (!form.title.trim()) {
      setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") }));
    }
  };

  // ── Crear ───────────────────────────────────────────────────────────────
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Escribe un título"); return; }

    setGuardando(true);
    const r =
      modo === "archivo"
        ? archivo
          ? await upload({ courseId, title: form.title.trim(), description: form.description.trim() || undefined, type: form.type, file: archivo })
          : { success: false, error: "Selecciona un archivo" }
        : await createLink({ courseId, title: form.title.trim(), description: form.description.trim() || undefined, type: form.type, externalUrl: form.externalUrl.trim() });
    setGuardando(false);

    if (!r.success || !("data" in r) || !r.data) { toast.error(r.error || "No se pudo guardar"); return; }
    setRecursos((prev) => [...prev, r.data!]);
    setForm(FORM_VACIO);
    setArchivo(null);
    if (inputRef.current) inputRef.current.value = "";
    toast.success("Recurso agregado");
  };

  // ── Editar ──────────────────────────────────────────────────────────────
  const empezarEdicion = (r: CourseResource) => {
    setEditando(r.id);
    setEdicion({ title: r.title, description: r.description ?? "", type: r.type, externalUrl: r.externalUrl ?? "" });
  };

  const guardarEdicion = async (r: CourseResource) => {
    if (!edicion.title.trim()) { toast.error("El título no puede estar vacío"); return; }
    const res = await update(r.id, {
      title: edicion.title.trim(),
      description: edicion.description.trim(),
      type: edicion.type,
      ...(!r.isFile && edicion.externalUrl.trim() ? { externalUrl: edicion.externalUrl.trim() } : {}),
    });
    if (!res.success || !res.data) { toast.error(res.error || "No se pudo guardar"); return; }
    setRecursos((prev) => prev.map((x) => (x.id === r.id ? res.data! : x)));
    setEditando(null);
    toast.success("Recurso actualizado");
  };

  // ── Reordenar (intercambia el orden con el vecino) ──────────────────────
  const mover = async (idx: number, dir: -1 | 1) => {
    const otro = idx + dir;
    if (otro < 0 || otro >= recursos.length) return;
    const a = recursos[idx], b = recursos[otro];
    const lista = [...recursos];
    lista[idx] = b; lista[otro] = a;
    setRecursos(lista);
    const [r1, r2] = await Promise.all([
      update(a.id, { orderNumber: otro + 1 }),
      update(b.id, { orderNumber: idx + 1 }),
    ]);
    if (!r1.success || !r2.success) { toast.error("No se pudo reordenar"); cargar(); }
  };

  // ── Eliminar ────────────────────────────────────────────────────────────
  const eliminar = async (r: CourseResource) => {
    if (!window.confirm(`¿Eliminar "${r.title}"? ${r.isFile ? "El archivo se borrará definitivamente." : ""}`)) return;
    const res = await remove(r.id);
    if (!res.success) { toast.error(res.error || "No se pudo eliminar"); return; }
    setRecursos((prev) => prev.filter((x) => x.id !== r.id));
    toast.success("Recurso eliminado");
  };

  return (
    <div className="space-y-8">
      {/* ── Formulario ─────────────────────────────────────────────────── */}
      <form onSubmit={handleCrear} className="card-dark p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-white">Agregar un recurso</h2>
          <div className="inline-flex rounded-lg border border-[rgba(0,192,231,0.3)] p-0.5">
            {(["archivo", "enlace"] as Modo[]).map((m) => (
              <button key={m} type="button" onClick={() => { setModo(m); setForm((p) => ({ ...p, type: m === "enlace" ? "enlace" : p.type === "enlace" ? "guia" : p.type })); }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${modo === m ? "bg-[#00C0E7] text-[#0d0d0d]" : "text-gray-400 hover:text-[#00C0E7]"}`}>
                {m === "archivo" ? "Subir archivo" : "Agregar enlace"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-1">
          Guías, ejercicios, lecturas y plantillas para los alumnos inscritos. Solo ellos pueden descargarlos.
        </p>

        {modo === "archivo" ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastrando(false); elegirArchivo(e.dataTransfer.files?.[0]); }}
            onClick={() => inputRef.current?.click()}
            className={`mt-5 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              arrastrando ? "border-[#00C0E7] bg-[rgba(0,192,231,0.06)]" : "border-[rgba(0,192,231,0.3)] hover:border-[#00C0E7]"
            }`}
          >
            <input ref={inputRef} type="file" accept={EXTENSIONES_RECURSO} className="hidden"
              onChange={(e) => elegirArchivo(e.target.files?.[0])} />
            {archivo ? (
              <div className="flex items-center justify-center gap-3">
                <ResourceIcon resource={{ fileName: archivo.name, isFile: true, type: form.type }} />
                <div className="text-left min-w-0">
                  <p className="text-white text-sm font-semibold truncate max-w-[260px]">{archivo.name}</p>
                  <p className="text-gray-500 text-xs">{tamano(archivo.size)} · clic para cambiar</p>
                </div>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-9 w-9 text-[#00C0E7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-white font-semibold">Arrastra el archivo aquí o haz clic para elegirlo</p>
                <p className="mt-1 text-xs text-gray-500">PDF, Word, Excel, PowerPoint, ZIP, TXT o imágenes · máx. {MAX_RECURSO_MB} MB</p>
              </>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <label className="label-dark">Enlace (Google Drive, GitHub, página web…)</label>
            <input type="url" value={form.externalUrl} placeholder="https://..."
              onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))}
              className="input-dark" />
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
          <div>
            <label className="label-dark">Título</label>
            <input type="text" value={form.title} maxLength={200} placeholder="Ej. Guía 1: Instalación del entorno"
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="input-dark" />
          </div>
          <div>
            <label className="label-dark">Tipo</label>
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as TipoRecurso }))} className="input-dark">
              {TIPOS_RECURSO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="label-dark">Descripción (opcional)</label>
          <textarea value={form.description} rows={2} placeholder="¿Qué encontrará el alumno en este recurso?"
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="input-dark resize-y" />
        </div>

        <button type="submit" disabled={guardando} className="mt-5 btn-red px-5 py-2 text-sm">
          {guardando ? (modo === "archivo" ? "Subiendo…" : "Guardando…") : "Agregar recurso"}
        </button>
      </form>

      {/* ── Lista ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-brand text-white text-lg uppercase tracking-wide mb-1">Recursos del curso</h2>
        <div className="h-[2px] w-10 bg-[#E31E24] rounded mb-4" />

        {cargando ? (
          <div className="card-dark p-10 flex justify-center"><div className="spinner-cyan" /></div>
        ) : recursos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgba(0,192,231,0.3)] bg-[#111827] p-10 text-center">
            <p className="text-gray-400">Este curso todavía no tiene recursos. Agrega el primero arriba.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recursos.map((r, idx) => (
              <div key={r.id} className="card-dark p-4">
                {editando === r.id ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
                      <input type="text" value={edicion.title} maxLength={200}
                        onChange={(e) => setEdicion((p) => ({ ...p, title: e.target.value }))} className="input-dark" />
                      <select value={edicion.type} onChange={(e) => setEdicion((p) => ({ ...p, type: e.target.value as TipoRecurso }))} className="input-dark">
                        {TIPOS_RECURSO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    {!r.isFile && (
                      <input type="url" value={edicion.externalUrl} placeholder="https://..."
                        onChange={(e) => setEdicion((p) => ({ ...p, externalUrl: e.target.value }))} className="input-dark" />
                    )}
                    <textarea value={edicion.description} rows={2} placeholder="Descripción (opcional)"
                      onChange={(e) => setEdicion((p) => ({ ...p, description: e.target.value }))} className="input-dark resize-y" />
                    <div className="flex gap-2">
                      <button onClick={() => guardarEdicion(r)} className="btn-red px-4 py-1.5 text-sm">Guardar</button>
                      <button onClick={() => setEditando(null)} className="rounded-lg px-4 py-1.5 text-sm text-gray-400 hover:text-white">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <ResourceIcon resource={r} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${claseTipo(r.type)}`}>{etiquetaTipo(r.type)}</span>
                        <span className="text-gray-500 text-[11px] truncate max-w-[280px]">
                          {r.isFile ? `${r.fileName ?? ""}${r.fileSize ? " · " + tamano(r.fileSize) : ""}` : r.externalUrl}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-sm mt-1">{r.title}</p>
                      {r.description && <p className="text-gray-500 text-xs mt-0.5">{r.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => mover(idx, -1)} disabled={idx === 0} title="Subir"
                        className="rounded p-1.5 text-gray-400 hover:text-[#00C0E7] disabled:opacity-30">▲</button>
                      <button onClick={() => mover(idx, 1)} disabled={idx === recursos.length - 1} title="Bajar"
                        className="rounded p-1.5 text-gray-400 hover:text-[#00C0E7] disabled:opacity-30">▼</button>
                      <button onClick={() => download(r.id)} title="Ver"
                        className="rounded px-2 py-1 text-xs font-semibold text-[#00C0E7] hover:underline">Ver</button>
                      <button onClick={() => empezarEdicion(r)}
                        className="rounded px-2 py-1 text-xs font-semibold text-gray-400 hover:text-white">Editar</button>
                      <button onClick={() => eliminar(r)}
                        className="rounded px-2 py-1 text-xs font-semibold text-[#E31E24] hover:underline">Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
