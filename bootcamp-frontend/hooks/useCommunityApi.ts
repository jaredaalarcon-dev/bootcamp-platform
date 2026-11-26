// src/hooks/useCommunityApi.ts
// Notificaciones, preguntas por lección, reseñas y cuestionarios.
import { apiClient } from "@/lib/api-client";

// ── Tipos ───────────────────────────────────────────────────────────────────
export type TipoNotificacion = "curso_nuevo" | "certificado" | "constancia" | "respuesta" | "general";

export interface Notificacion {
  id: string;
  type: TipoNotificacion;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PreguntaLeccion {
  id: string;
  lessonId: string;
  authorName: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  answeredBy: string | null;
  createdAt: string;
  mine: boolean;
}

export interface PreguntaAdmin extends PreguntaLeccion {
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
}

export interface Resena {
  id: string;
  courseId: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  mine: boolean;
  hidden?: boolean;
  courseTitle?: string;
}

export interface ResumenResenas {
  total: number;
  promedio: number;
  distribucion: Record<1 | 2 | 3 | 4 | 5, number>;
  items: Resena[];
  mine: Resena | null;
  canReview: boolean;
}

export interface CuestionarioResumen {
  id: string;
  title: string;
  description: string | null;
  moduleId: string | null;
  lessonId: string | null;
  passingScore: number;
  questionCount: number;
  bestScore: number | null;
  attempts: number;
  passed: boolean;
}

export interface CuestionarioAlumno {
  id: string;
  courseId: string;
  moduleId: string | null;
  lessonId: string | null;
  title: string;
  description: string | null;
  passingScore: number;
  bestScore: number | null;
  attempts: number;
  passed: boolean;
  questions: { id: string; text: string; options: string[] }[];
}

export interface ResultadoCuestionario {
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  bestScore: number;
  attempts: number;
  results: { questionId: string; chosen: number; correctIndex: number; correct: boolean; explanation: string | null }[];
}

export interface PreguntaCuestionario {
  id?: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string | null;
}

export interface CuestionarioAdmin {
  id: string;
  courseId: string;
  moduleId: string | null;
  lessonId: string | null;
  title: string;
  description: string | null;
  passingScore: number;
  published: boolean;
  questions: PreguntaCuestionario[];
  stats: { intentos: number; alumnos: number; promedio: number; aprobados: number };
}

export interface GuardarCuestionario {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  description?: string;
  passingScore: number;
  published: boolean;
  questions: { text: string; options: string[]; correctIndex: number; explanation?: string }[];
}

// Mensaje de error legible que devuelve el backend
export const mensajeError = (err: unknown, porDefecto = "Ocurrió un error. Inténtalo de nuevo.") => {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  const texto = Array.isArray(m) ? m[0] : m;
  return (texto ?? porDefecto).replace(/^questions\.\d+\./, "");
};

// ── Notificaciones ──────────────────────────────────────────────────────────
export const notificationsApi = {
  async list(limit = 30): Promise<{ items: Notificacion[]; unread: number }> {
    const { data } = await apiClient.get("/notifications", { params: { limit } });
    return data.data;
  },
  async unread(): Promise<number> {
    const { data } = await apiClient.get("/notifications/unread-count");
    return data.data.unread;
  },
  async read(id: string) {
    await apiClient.patch(`/notifications/${id}/read`);
  },
  async readAll() {
    await apiClient.patch("/notifications/read-all");
  },
  async remove(id: string) {
    await apiClient.delete(`/notifications/${id}`);
  },
};

// ── Preguntas por lección ───────────────────────────────────────────────────
export const questionsApi = {
  async list(lessonId: string): Promise<PreguntaLeccion[]> {
    const { data } = await apiClient.get(`/community/lessons/${lessonId}/questions`);
    return data.data;
  },
  async ask(lessonId: string, question: string): Promise<PreguntaLeccion> {
    const { data } = await apiClient.post(`/community/lessons/${lessonId}/questions`, { question });
    return data.data;
  },
  async remove(id: string) {
    await apiClient.delete(`/community/questions/${id}`);
  },
  // Admin
  async adminList(estado: "pendientes" | "respondidas" | "todas", courseId?: string): Promise<{ pendientes: number; items: PreguntaAdmin[] }> {
    const { data } = await apiClient.get("/admin/community/questions", { params: { estado, courseId: courseId || undefined } });
    return data.data;
  },
  async pendingCount(): Promise<number> {
    const { data } = await apiClient.get("/admin/community/questions/pending-count");
    return data.data.pendientes;
  },
  async answer(id: string, answer: string): Promise<PreguntaLeccion> {
    const { data } = await apiClient.patch(`/admin/community/questions/${id}/answer`, { answer });
    return data.data;
  },
  async adminRemove(id: string) {
    await apiClient.delete(`/admin/community/questions/${id}`);
  },
};

// ── Reseñas ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  async forCourse(courseId: string): Promise<ResumenResenas> {
    const { data } = await apiClient.get(`/community/courses/${courseId}/reviews`);
    return data.data;
  },
  async summary(): Promise<Record<string, { promedio: number; total: number }>> {
    const { data } = await apiClient.get("/community/reviews/summary");
    return data.data;
  },
  async save(courseId: string, rating: number, comment: string): Promise<Resena> {
    const { data } = await apiClient.put(`/community/courses/${courseId}/review`, { rating, comment });
    return data.data;
  },
  async remove(courseId: string) {
    await apiClient.delete(`/community/courses/${courseId}/review`);
  },
  // Admin
  async adminList(courseId?: string): Promise<{ total: number; promedio: number; ocultas: number; items: Resena[] }> {
    const { data } = await apiClient.get("/admin/community/reviews", { params: { courseId: courseId || undefined } });
    return data.data;
  },
  async setHidden(id: string, hidden: boolean) {
    await apiClient.patch(`/admin/community/reviews/${id}/visibility`, { hidden });
  },
  async adminRemove(id: string) {
    await apiClient.delete(`/admin/community/reviews/${id}`);
  },
};

// ── Cuestionarios ───────────────────────────────────────────────────────────
export const quizzesApi = {
  async forCourse(courseId: string): Promise<CuestionarioResumen[]> {
    const { data } = await apiClient.get(`/quizzes/course/${courseId}`);
    return data.data;
  },
  async get(id: string): Promise<CuestionarioAlumno> {
    const { data } = await apiClient.get(`/quizzes/${id}`);
    return data.data;
  },
  async submit(id: string, answers: Record<string, number>): Promise<ResultadoCuestionario> {
    const { data } = await apiClient.post(`/quizzes/${id}/attempts`, { answers });
    return data.data;
  },
  // Admin
  async adminList(courseId: string): Promise<CuestionarioAdmin[]> {
    const { data } = await apiClient.get(`/admin/quizzes/course/${courseId}`);
    return data.data;
  },
  async create(body: GuardarCuestionario) {
    const { data } = await apiClient.post("/admin/quizzes", body);
    return data.data as { id: string };
  },
  async update(id: string, body: GuardarCuestionario) {
    const { data } = await apiClient.put(`/admin/quizzes/${id}`, body);
    return data.data as { id: string };
  },
  async remove(id: string) {
    await apiClient.delete(`/admin/quizzes/${id}`);
  },
};

// Fecha relativa corta: "hace 5 min", "ayer", "12 nov"
export function haceCuanto(fecha: string) {
  const d = new Date(fecha);
  const seg = Math.round((Date.now() - d.getTime()) / 1000);
  if (seg < 60) return "hace un momento";
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}
