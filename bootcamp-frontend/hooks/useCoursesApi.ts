// src/hooks/useCoursesApi.ts
import { apiClient } from "@/lib/api-client";
import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  duration?: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  orderNumber?: number;
  video?: Video;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  orderNumber?: number;
  lessons?: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  status: string;
  category?: Category;
  modules?: Module[];
}

interface Enrollment {
  id: string;
  status: string;
  userId: string;
  courseId: string;
  course?: Course;
}

export function useCoursesApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // ✅ OBTENER TODOS LOS CURSOS DEL BACKEND REAL
  const getCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      // 📡 LLAMAR AL BACKEND REAL
      const { data } = await apiClient.get("/courses");

      setLoading(false);
      return { success: true, data: data.data || data };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al obtener cursos";
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // ✅ OBTENER CURSO POR ID DEL BACKEND REAL
  const getCourseById = async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 📡 LLAMAR AL BACKEND REAL
      const { data } = await apiClient.get(`/courses/${courseId}`);

      setLoading(false);
      return { success: true, data: data.data || data };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al obtener curso";
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // ✅ INSCRIBIRSE A UN CURSO DEL BACKEND REAL
  const enrollCourse = async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 📡 LLAMAR AL BACKEND REAL
      const { data } = await apiClient.post("/enrollments", {
        courseId: courseId,
      });

      setLoading(false);
      return { success: true, data: data.data || data };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al inscribirse";
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // ✅ OBTENER MIS INSCRIPCIONES DEL BACKEND REAL
  const getMyEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      // 📡 LLAMAR AL BACKEND REAL
      const { data } = await apiClient.get("/enrollments/my-enrollments");

      setLoading(false);
      return { success: true, data: data.data || data };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al obtener inscripciones";
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // ¿El usuario ya está inscrito en este curso?
  const checkEnrollment = async (courseId: string) => {
    try {
      const { data } = await apiClient.get(`/enrollments/check/${courseId}`);
      const resultado = data.data || data;
      return { success: true, enrolled: Boolean(resultado?.enrolled) };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al verificar la inscripción";
      return { success: false, enrolled: false, error: errorMessage };
    }
  };

  return {
    getCourses,
    getCourseById,
    enrollCourse,
    checkEnrollment,
    getMyEnrollments,
    loading,
    error,
  };
}
