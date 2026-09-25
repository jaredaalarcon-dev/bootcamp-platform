// src/app/register/page.tsx
"use client";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-2">
          <h1 className="font-brand text-[#00C0E7] text-3xl uppercase tracking-wide">
            Soluciones Integrales JB
          </h1>
          <p className="text-white font-bold text-lg">Bootcamp</p>
        </div>
        <div className="line-red mb-6" />

        <div className="bg-card border border-[rgba(0,192,231,0.2)] rounded-xl px-8 py-7">
          <h2 className="text-white text-xl font-semibold text-center mb-1">Crea tu Cuenta</h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            Únete a nuestra comunidad de aprendizaje y comienza tus cursos hoy
          </p>
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          © 2024 Bootcamp Platform. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
