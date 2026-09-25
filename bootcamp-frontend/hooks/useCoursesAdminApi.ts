// src/hooks/useCoursesAdminApi.ts
import { apiClient } from "@/lib/api-client";

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  status: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export function useCoursesAdminApi() {


  // CRUD Cursos
  const getCourses = async () => {
    try {
      const { data } = await apiClient.get("/courses");
      return { success: true, data: data.data || data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Error al obtener cursos",
      };
    }
  };

  const getCourseById = async (id: string) => {
    try {
      const { data } = await apiClient.get(`/courses/${id}`);
      return { success: true, data: data.data || data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Error al obtener curso",
      };
    }
  };

  const createCourse = async (courseData: any) => {
    try {
      const { data } = await apiClient.post("/courses", courseData);
      return { success: true, data: data.data || data };
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return {
        success: false,
        error: Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Error al crear curso",
      };
    }
  };

  const updateCourse = async (id: string, courseData: any) => {
    try {
      const { data } = await apiClient.patch(`/courses/${id}`, courseData);
      return { success: true, data: data.data || data };
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return {
        success: false,
        error: Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Error al actualizar curso",
      };
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      await apiClient.delete(`/courses/${id}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Error al eliminar curso",
      };
    }
  };

  // CRUD Categorías
  const getCategories = async () => {
    try {
      const { data } = await apiClient.get("/categories");
      return { success: true, data: data.data || data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Error al obtener categorías",
      };
    }
  };

  const createCategory = async (categoryData: {
    name: string;
    description?: string;
  }) => {
    try {
      // Aseguramos que los campos enviados coincidan exactamente con la DTO del backend
      const payload = {
        name: categoryData.name,
        description: categoryData.description || "",
      };

      const { data } = await apiClient.post("/categories", payload);
      return { success: true, data: data.data || data };
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return {
        success: false,
        error: Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Error al crear categoría",
      };
    }
  };

  const updateCategory = async (
    id: string,
    categoryData: { name: string; description?: string },
  ) => {
    try {
      const payload = {
        name: categoryData.name,
        description: categoryData.description || "",
      };

      const { data } = await apiClient.patch(`/categories/${id}`, payload);
      return { success: true, data: data.data || data };
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return {
        success: false,
        error: Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Error al actualizar categoría",
      };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await apiClient.delete(`/categories/${id}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Error al eliminar categoría",
      };
    }
  };

  return {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
