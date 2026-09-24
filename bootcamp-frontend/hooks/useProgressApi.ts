// src/hooks/useProgressApi.ts
import { useState } from "react";
import { api } from "@/lib/api";

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  completedLessonIds: string[];
}

export interface ProgressSummary {
  enrolledCourses: number;
  activeCourses: number;
  completedCourses: number;
  completedLessons: number;
  totalLessons: number;
  overallPercentage: number;
}

export interface MyCourse {
  enrollmentId: string;
  status: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    description: string;
    image: string;
    category?: { name: string };
  };
  progress: {
    totalLessons: number;
    completedLessons: number;
    percentage: number;
  };
}

export function useProgressApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mensajeDeError = (err: any, porDefecto: string) =>
    err?.response?.data?.message || porDefecto;

  const getCourseProgress = async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/progress/course/${courseId}`);
      return { success: true, data: (data.data || data) as CourseProgress };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "Error al obtener el progreso");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const toggleLesson = async (lessonId: string, completed: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/progress/lesson/${lessonId}`, {
        completed,
      });
      return { success: true, data: data.data || data };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "Error al guardar el progreso");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const getSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/progress/summary");
      return { success: true, data: (data.data || data) as ProgressSummary };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "Error al obtener el resumen");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const getMyCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/progress/my-courses");
      return { success: true, data: (data.data || data) as MyCourse[] };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "Error al obtener tus cursos");
      setError(mensaje);
      return { success: false, error: mensaje, data: [] as MyCourse[] };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getCourseProgress,
    toggleLesson,
    getSummary,
    getMyCourses,
  };
}
