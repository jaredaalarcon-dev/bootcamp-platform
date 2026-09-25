// src/hooks/useContentApi.ts
import { apiClient } from "@/lib/api-client";
import { useState } from "react";

export interface Video {
  id: string;
  title?: string;
  videoUrl?: string;
  duration?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  orderNumber?: number;
  video?: Video;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  orderNumber?: number;
  lessons?: Lesson[];
}

interface DatosModulo {
  title: string;
  description?: string;
  courseId: string;
  orderNumber?: number;
}

interface DatosLeccion {
  title: string;
  description?: string;
  moduleId: string;
  orderNumber?: number;
  videoUrl?: string;
  videoTitle?: string;
  duration?: number;
}

export function useContentApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Estos endpoints lanzan errores HTTP de verdad (404, 400...),
  // así que axios entra al catch cuando algo sale mal.
  const mensajeDeError = (err: any, porDefecto: string) =>
    err?.response?.data?.message || err?.message || porDefecto;

  const getModulesByCourse = async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/modules/course/${courseId}`);
      return { success: true, data: (data ?? []) as CourseModule[] };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "No se pudo cargar el contenido");
      setError(mensaje);
      return { success: false, error: mensaje, data: [] as CourseModule[] };
    } finally {
      setLoading(false);
    }
  };

  const createModule = async (datos: DatosModulo) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post("/modules", datos);
      return { success: true, data: data as CourseModule };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "No se pudo crear el módulo");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const updateModule = async (id: string, datos: Partial<DatosModulo>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.patch(`/modules/${id}`, datos);
      return { success: true, data: data as CourseModule };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "No se pudo actualizar el módulo");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const deleteModule = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/modules/${id}`);
      return { success: true };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "No se pudo eliminar el módulo");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const createLesson = async (datos: DatosLeccion) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post("/lessons", datos);
      return { success: true, data: data as Lesson };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "No se pudo crear la lección");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const updateLesson = async (id: string, datos: Partial<DatosLeccion>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.patch(`/lessons/${id}`, datos);
      return { success: true, data: data as Lesson };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "No se pudo actualizar la lección");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/lessons/${id}`);
      return { success: true };
    } catch (err: any) {
      const mensaje = mensajeDeError(err, "No se pudo eliminar la lección");
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getModulesByCourse,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
  };
}
