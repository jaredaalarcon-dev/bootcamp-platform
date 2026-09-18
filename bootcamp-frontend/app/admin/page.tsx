// src/app/admin/page.tsx
"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  const adminCards = [
    {
      title: "Gestionar Cursos",
      description: "Crea, edita, publica o elimina cursos del catálogo.",
      href: "/admin/courses",
      icon: "📚",
      active: true,
    },
    {
      title: "Gestionar Categorías",
      description: "Organiza las categorías e insignias de la plataforma.",
      href: "/admin/categories",
      icon: "🏷️",
      active: true,
    },
    {
      title: "Volver al Dashboard",
      description: "Regresa a la vista principal de usuario / estudiante.",
      href: "/dashboard",
      icon: "🏠",
      active: true,
    },
    {
      title: "Usuarios y Roles",
      description: "Administra permisos de estudiantes e instructores.",
      href: "#",
      icon: "👥",
      active: false,
    },
    {
      title: "Reportes y Métricas",
      description: "Visualiza inscripciones y avance de alumnos.",
      href: "#",
      icon: "📊",
      active: false,
    },
    {
      title: "Configuración General",
      description: "Ajustes de pagos, correos y variables del sistema.",
      href: "#",
      icon: "⚙️",
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="mt-1 text-gray-600">
              Selecciona una opción para gestionar la plataforma.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300 transition-colors"
          >
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Grid con las 6 Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminCards.map((card, index) => (
            <div
              key={index}
              className={`relative rounded-xl border bg-white p-6 shadow-sm transition-all ${
                card.active
                  ? "border-gray-200 hover:border-green-500 hover:shadow-md"
                  : "opacity-60 border-gray-100"
              }`}
            >
              <div className="mb-4 text-3xl">{card.icon}</div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">
                {card.title}
              </h2>
              <p className="mb-6 text-sm text-gray-600">{card.description}</p>

              {card.active ? (
                <Link
                  href={card.href}
                  className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Ingresar →
                </Link>
              ) : (
                <span className="inline-block rounded bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                  Próximamente
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
