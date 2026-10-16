// src/hooks/useResourcesApi.ts
// Recursos de un curso: guías, ejercicios, lecturas, plantillas y enlaces.
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export type TipoRecurso = "guia" | "ejercicio" | "lectura" | "plantilla" | "enlace" | "otro";

export interface CourseResource {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  type: TipoRecurso;
  isFile: boolean;
  externalUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  orderNumber: number;
  createdAt: string;
}

export const TIPOS_RECURSO: { value: TipoRecurso; label: string }[] = [
  { value: "guia", label: "Guía" },
  { value: "ejercicio", label: "Ejercicios" },
  { value: "lectura", label: "Lectura" },
  { value: "plantilla", label: "Plantilla" },
  { value: "enlace", label: "Enlace" },
  { value: "otro", label: "Otro" },
];

export const EXTENSIONES_RECURSO = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.png,.jpg,.jpeg";
export const MAX_RECURSO_MB = 25;

const mensaje = (err: any, porDefecto: string) => {
  const m = err?.response?.data?.message;
  if (Array.isArray(m)) return m.join(". ");
  return m || porDefecto;
};

export function useResourcesApi() {
  const [loading, setLoading] = useState(false);

  const getByCourse = async (courseId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/resources/course/${courseId}`);
      return { success: true, data: (data?.data ?? []) as CourseResource[] };
    } catch (err: any) {
      return { success: false, data: [] as CourseResource[], status: err?.response?.status, error: mensaje(err, "No se pudieron cargar los recursos") };
    } finally {
      setLoading(false);
    }
  };

  /** Pide un enlace temporal y abre la descarga */
  const download = async (id: string) => {
    try {
      const { data } = await apiClient.get(`/resources/${id}/download`);
      const url = data?.data?.url as string | undefined;
      if (!url) throw new Error();
      window.open(url, "_blank", "noopener,noreferrer");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo abrir el recurso") };
    }
  };

  const upload = async (datos: { courseId: string; title: string; description?: string; type: TipoRecurso; file: File }) => {
    const fd = new FormData();
    fd.append("courseId", datos.courseId);
    fd.append("title", datos.title);
    if (datos.description) fd.append("description", datos.description);
    fd.append("type", datos.type);
    fd.append("file", datos.file);
    try {
      // Sin Content-Type manual: el navegador agrega el boundary del multipart
      const { data } = await apiClient.post("/resources/upload", fd);
      return { success: true, data: data?.data as CourseResource };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo subir el archivo") };
    }
  };

  const createLink = async (datos: { courseId: string; title: string; description?: string; type: TipoRecurso; externalUrl: string }) => {
    try {
      const { data } = await apiClient.post("/resources/link", datos);
      return { success: true, data: data?.data as CourseResource };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo guardar el enlace") };
    }
  };

  const update = async (id: string, datos: Partial<Pick<CourseResource, "title" | "description" | "type" | "externalUrl" | "orderNumber">>) => {
    try {
      const { data } = await apiClient.patch(`/resources/${id}`, datos);
      return { success: true, data: data?.data as CourseResource };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo actualizar el recurso") };
    }
  };

  const remove = async (id: string) => {
    try {
      await apiClient.delete(`/resources/${id}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo eliminar el recurso") };
    }
  };

  return { getByCourse, download, upload, createLink, update, remove, loading };
}
