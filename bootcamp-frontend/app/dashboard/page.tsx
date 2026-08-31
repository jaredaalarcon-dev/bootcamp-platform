// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { getUser, getToken, logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const userData = getUser();
    setUser(userData);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bootcamp</h1>
              <p className="text-sm text-gray-600">Plataforma Educativa</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-600">Estudiante</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Welcome Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200 md:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900">
              ¡Bienvenido, {user.email}!
            </h2>
            <p className="mt-2 text-gray-600">
              Accede a tus cursos, continúa aprendiendo y alcanza tus metas
              educativas.
            </p>
          </div>

          {/* Stats Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">0</div>
              <p className="mt-2 text-sm text-gray-600">Cursos Activos</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">0%</div>
              <p className="mt-2 text-sm text-gray-600">Progreso General</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">0</div>
              <p className="mt-2 text-sm text-gray-600">
                Lecciones Completadas
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-lg bg-blue-50 p-6 ring-1 ring-blue-200 md:col-span-3">
            <h3 className="font-semibold text-blue-900">
              ✨ Próximas Características
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-blue-800">
              <li>📚 Acceso a cursos y módulos</li>
              <li>📹 Reproductor de videos integrado</li>
              <li>📊 Seguimiento de progreso en tiempo real</li>
              <li>🎯 Evaluaciones y certificados</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
