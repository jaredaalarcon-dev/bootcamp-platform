// src/app/admin/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useCoursesAdminApi, Category } from "@/hooks/useCoursesAdminApi";
import toast from "react-hot-toast";

const FORM_VACIO = { name: "", description: "" };

export default function AdminCategoriesPage() {
  const { getCategories, createCategory, updateCategory, deleteCategory } =
    useCoursesAdminApi();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const result = await getCategories();
    if (result.success) {
      const data = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.data)
          ? result.data.data
          : [];
      setCategories(data);
    } else {
      setCategories([]);
    }
    setLoading(false);
  };

  const abrirNueva = () => {
    setSelected(null);
    setFormData(FORM_VACIO);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setSelected(category);
    setFormData({ name: category.name, description: category.description || "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cerrar = () => {
    setShowForm(false);
    setSelected(null);
    setFormData(FORM_VACIO);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setGuardando(true);
    const result = selected
      ? await updateCategory(selected.id, formData)
      : await createCategory(formData);
    setGuardando(false);

    if (result.success) {
      toast.success(selected ? "Categoría actualizada" : "Categoría creada");
      cerrar();
      loadCategories();
    } else {
      toast.error(result.error || "Error al guardar");
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    const result = await deleteCategory(category.id);
    if (result.success) {
      toast.success("Categoría eliminada");
      loadCategories();
    } else {
      toast.error(result.error || "No se pudo eliminar. ¿Tiene cursos asignados?");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">
            {categories.length} categorías para organizar tus cursos
          </p>
        </div>
        <button
          onClick={() => (showForm ? cerrar() : abrirNueva())}
          className={showForm ? "btn-cyan text-sm py-2" : "btn-red text-sm py-2"}
        >
          {showForm ? "Cancelar" : "+ Nueva Categoría"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-dark p-6 space-y-4">
          <div>
            <h2 className="text-white font-semibold text-lg">
              {selected ? "Editar categoría" : "Nueva categoría"}
            </h2>
            <div className="h-[2px] w-12 bg-[#E31E24] rounded mt-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Desarrollo Web"
                className="input-dark"
              />
            </div>
            <div>
              <label className="label-dark">Descripción</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción de la categoría"
                className="input-dark"
              />
            </div>
          </div>
          <button type="submit" disabled={guardando} className="btn-red text-sm py-2">
            {guardando ? "Guardando..." : selected ? "Actualizar categoría" : "Crear categoría"}
          </button>
        </form>
      )}

      {/* Tabla */}
      <div className="card-dark overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner-cyan" /></div>
        ) : categories.length === 0 ? (
          <p className="py-16 text-center text-gray-500 text-sm">No hay categorías todavía</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className="th-brand">Nombre</th>
                  <th className="th-brand hidden sm:table-cell">Descripción</th>
                  <th className="th-brand text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-800/60 hover:bg-[rgba(0,192,231,0.04)] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-[#00C0E7] shrink-0" />
                        <span className="text-white font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">
                      <span className="line-clamp-1">{category.description || "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:border-[#00C0E7] hover:text-[#00C0E7] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="rounded-lg border border-[rgba(231,30,36,0.4)] px-3 py-1.5 text-xs font-semibold text-[#E31E24] hover:bg-[rgba(231,30,36,0.1)] transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
