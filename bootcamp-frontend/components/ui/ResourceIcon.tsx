// src/components/ui/ResourceIcon.tsx
// Ícono y etiqueta de cada tipo de recurso (compartido por alumno y admin).
import type { CourseResource, TipoRecurso } from "@/hooks/useResourcesApi";

const ESTILO: Record<TipoRecurso, { label: string; clase: string }> = {
  guia:      { label: "Guía",       clase: "bg-[rgba(0,192,231,0.12)] text-[#00C0E7]" },
  ejercicio: { label: "Ejercicios", clase: "bg-[rgba(231,30,36,0.12)] text-[#E31E24]" },
  lectura:   { label: "Lectura",    clase: "bg-[rgba(0,192,231,0.12)] text-[#00C0E7]" },
  plantilla: { label: "Plantilla",  clase: "bg-[rgba(231,30,36,0.12)] text-[#E31E24]" },
  enlace:    { label: "Enlace",     clase: "bg-[rgba(0,192,231,0.12)] text-[#00C0E7]" },
  otro:      { label: "Otro",       clase: "bg-[rgba(0,192,231,0.12)] text-[#00C0E7]" },
};

export const etiquetaTipo = (t: TipoRecurso) => ESTILO[t]?.label ?? "Recurso";
export const claseTipo = (t: TipoRecurso) => ESTILO[t]?.clase ?? ESTILO.otro.clase;

/** Extensión en mayúsculas para mostrar (PDF, DOCX…) */
export function extension(r: Pick<CourseResource, "fileName" | "isFile">) {
  if (!r.isFile || !r.fileName) return "LINK";
  const p = r.fileName.split(".");
  return p.length > 1 ? p.pop()!.toUpperCase().slice(0, 4) : "FILE";
}

export function tamano(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourceIcon({ resource }: { resource: Pick<CourseResource, "fileName" | "isFile" | "type"> }) {
  const ext = extension(resource);
  const esEnlace = !resource.isFile;
  return (
    <div className={`relative flex h-12 w-11 shrink-0 items-center justify-center rounded-lg ${claseTipo(resource.type)}`}>
      {esEnlace ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-[#E31E24] px-1 text-[8px] font-bold leading-[12px] text-white">
        {ext}
      </span>
    </div>
  );
}
