// src/hooks/useCertificatesApi.ts
// Certificados (pagados) y constancias (gratis), datos del alumno y verificación.
import { apiClient } from "@/lib/api-client";

export type TipoDocumento = "DNI" | "CE" | "PASAPORTE";
export type TipoEmitido = "certificado" | "constancia";

export interface CertificateProfile {
  fullName: string;
  documentType: TipoDocumento;
  documentNumber: string;
  photoUrl: string | null;
  suggestedName: string;
  email: string;
  complete: boolean;
  updatedAt: string | null;
}

export interface ExamenFinal { quizId: string; title: string; passingScore: number; passed: boolean; bestScore: number | null }

export interface CertSummary {
  profileComplete: boolean;
  profileBasic?: boolean;
  courses: {
    courseId: string;
    paid: boolean;
    paidAt: string | null;
    finalExam?: ExamenFinal | null;
    issued: { type: TipoEmitido; code: string; createdAt: string }[];
  }[];
}

export interface CertData {
  type: TipoEmitido;
  certificateId: string;
  studentName: string;
  document: string | null;
  photoUrl: string | null;
  courseName: string;
  courseCategory: string;
  completedAt: string;
  issuedAt: string;
  totalLessons: number;
  paid: boolean;
  finalExamScore?: number | null;
}

export interface VerifyResult {
  valid: boolean;
  code?: string;
  type?: TipoEmitido;
  studentName?: string;
  document?: string | null;
  courseName?: string;
  completedAt?: string;
  issuedAt?: string;
}

// Código que el servidor manda cuando falta algo (examen final o datos del perfil)
const codigoError = (err: unknown) =>
  (err as { response?: { data?: { code?: string; quizId?: string } } })?.response?.data ?? {};

const mensaje = (err: unknown, porDefecto: string) => {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(m) ? m[0] : (m ?? porDefecto);
};

export const TIPOS_DOC: { value: TipoDocumento; label: string }[] = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carné de extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
];

export const certificatesApi = {
  async getProfile(): Promise<CertificateProfile> {
    const { data } = await apiClient.get("/certificates/profile");
    return data.data;
  },
  async saveProfile(body: { fullName: string; documentType: TipoDocumento; documentNumber: string }) {
    try {
      const { data } = await apiClient.put("/certificates/profile", body);
      return { ok: true as const, data: data.data as CertificateProfile };
    } catch (err) {
      return { ok: false as const, error: mensaje(err, "No se pudieron guardar tus datos") };
    }
  },
  async uploadPhoto(file: File) {
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await apiClient.post("/certificates/profile/photo", form);
      return { ok: true as const, data: data.data as CertificateProfile };
    } catch (err) {
      return { ok: false as const, error: mensaje(err, "No se pudo subir la foto") };
    }
  },
  async deletePhoto(): Promise<CertificateProfile> {
    const { data } = await apiClient.delete("/certificates/profile/photo");
    return data.data;
  },
  async mySummary(): Promise<CertSummary> {
    const { data } = await apiClient.get("/certificates/my");
    return data.data;
  },
  async get(courseId: string, tipo?: TipoEmitido) {
    try {
      const { data } = await apiClient.get(`/certificates/course/${courseId}`, { params: tipo ? { tipo } : {} });
      return { ok: true as const, data: data.data as CertData };
    } catch (err) {
      const d = codigoError(err);
      return {
        ok: false as const,
        error: mensaje(err, "No se pudo cargar el documento"),
        code: d.code as "EXAMEN_FINAL" | "PERFIL_INCOMPLETO" | undefined,
        quizId: d.quizId,
      };
    }
  },
  async verify(code: string): Promise<VerifyResult> {
    const { data } = await apiClient.get(`/certificates/verify/${encodeURIComponent(code)}`);
    return data.data;
  },
};

// ── Admin: datos que registró cada alumno ──────────────────────────────────
export interface DatoCertificadoAdmin {
  userId: string;
  email: string;
  accountName: string;
  registeredAt: string;
  fullName: string | null;
  documentType: TipoDocumento | null;
  documentNumber: string | null;
  photoUrl: string | null;
  hasPhoto: boolean;
  updatedAt: string | null;
  basic: boolean;
  complete: boolean;
  completedCourses: number;
  constancias: number;
  certificados: number;
}

export const certificateDataAdminApi = {
  async list(): Promise<{ total: number; conDatos: number; conFoto: number; items: DatoCertificadoAdmin[] }> {
    const { data } = await apiClient.get("/admin/certificate-data");
    return data.data;
  },
  /** Borra solo la foto; al alumno le llega un aviso para subir otra. */
  async borrarFoto(userId: string, motivo?: string) {
    await apiClient.delete(`/admin/certificate-data/${userId}/photo`, { data: { motivo: motivo || undefined } });
  },
  /** Borra nombre, documento y foto; el alumno debe registrarlos de nuevo. */
  async borrarDatos(userId: string, motivo?: string) {
    await apiClient.delete(`/admin/certificate-data/${userId}`, { data: { motivo: motivo || undefined } });
  },
};
