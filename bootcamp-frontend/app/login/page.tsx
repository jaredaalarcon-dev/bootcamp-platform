// src/app/login/page.tsx
"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Bootcamp</h1>
          <p className="mt-2 text-gray-600">Plataforma Educativa</p>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            Inicia Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tus cursos y continúa aprendiendo
          </p>
        </div>

        {/* Form Card */}
        <div className="mt-8 rounded-lg bg-white px-8 py-6 shadow-sm ring-1 ring-gray-200">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          © 2024 Bootcamp Platform. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
