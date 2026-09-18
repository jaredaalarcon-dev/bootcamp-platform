"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCoursesAdminApi, Category } from "@/hooks/useCoursesAdminApi";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { getCategories, createCategory, updateCategory, deleteCategory } =
    useCoursesAdminApi();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const result = await getCategories();
    if (result.success) {
      // Garantizamos que siempre se guarde un arreglo
      const data = Array.isArray(result.data)
        ? result.data
        : result.data?.data && Array.isArray(result.data.data)
          ? result.data.data
          : [];
      setCategories(data);
    } else {
      setCategories([]);
    }
    setLoading(false);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("El nombre es requerido");
      return;
    }

    const result = selectedCategory
      ? await updateCategory(selectedCategory.id, formData)
      : await createCategory(formData);

    if (result.success) {
      toast.success(
        selectedCategory ? "Categoría actualizada" : "Categoría creada",
      );
      setShowForm(false);
      setSelectedCategory(null);
      setFormData({ name: "", description: "" });
      loadCategories();
    } else {
      toast.error(result.error || "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;

    const result = await deleteCategory(id);
    if (result.success) {
      toast.success("Categoría eliminada");
      loadCategories();
    } else {
      toast.error(result.error || "Error al eliminar");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-2xl font-bold text-gray-900">
              ← Administración
            </Link>
            <div className="text-sm font-medium text-gray-600">
              Gestionar Categorías
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
            <p className="mt-2 text-gray-600">
              Organiza tus cursos en categorías
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setFormData({ name: "", description: "" });
              setShowForm(!showForm);
            }}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            {showForm ? "Cancelar" : "+ Nueva Categoría"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  placeholder="Ej: Frontend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  placeholder="Descripción de la categoría"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
                >
                  {selectedCategory ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">Cargando categorías...</p>
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">No hay categorías</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {category.description?.substring(0, 50) || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
