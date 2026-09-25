// src/components/admin/CourseForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useCoursesAdminApi, Category, Course } from "@/hooks/useCoursesAdminApi";
import { ImageUpload } from "@/components/admin/ImageUpload";
import toast from "react-hot-toast";

interface CourseFormProps {
  course?: Course | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function CourseForm({ course, categories, onSuccess, onCancel }: CourseFormProps) {
  const { createCourse, updateCourse } = useCoursesAdminApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    categoryId: "",
    status: "draft",
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        image: course.image,
        categoryId: course.categoryId,
        status: course.status,
      });
    }
  }, [course]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.categoryId) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setLoading(true);
    const result = course
      ? await updateCourse(course.id, formData)
      : await createCourse(formData);

    if (result.success) {
      toast.success(course ? "Curso actualizado" : "Curso creado");
      onSuccess();
    } else {
      toast.error(result.error || "Error al guardar el curso");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Título del curso"
          disabled={loading}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Descripción del curso"
          disabled={loading}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        />
      </div>

      {/* Imagen — ahora es un uploader, no un input de texto */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Imagen de portada
        </label>
        <div className="mt-1">
          <ImageUpload
            currentUrl={formData.image}
            onUpload={(url) => setFormData((prev) => ({ ...prev, image: url }))}
            disabled={loading}
          />
        </div>
        {/* Campo oculto para mantener la URL en el formData */}
        <input type="hidden" name="image" value={formData.image} />
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Categoría <span className="text-red-500">*</span>
        </label>
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          disabled={loading}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Estado</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          disabled={loading}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          <option value="draft">Borrador</option>
          <option value="preparing">En Preparación</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
      </div>

      {/* Botones */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? "Guardando..." : course ? "Actualizar curso" : "Crear curso"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
