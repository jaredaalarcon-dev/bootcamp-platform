// src/app/admin/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import toast from "react-hot-toast";

const MENSAJES: Record<string, string> = {
  sesion: "Inicia sesión para entrar al panel.",
  expirada: "Tu sesión expiró. Vuelve a iniciar sesión.",
  conexion:
    "No se pudo contactar al servidor. Revisa que el backend esté corriendo.",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, loading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const motivo = sessionStorage.getItem("adminMotivo");
    if (motivo) {
      setAviso(MENSAJES[motivo] ?? null);
      sessionStorage.removeItem("adminMotivo");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error || "No pudimos iniciar tu sesión.");
      return;
    }

    // El rol viene del backend, firmado en el JWT
    const role = result.data?.user?.role;

    if (role !== "admin") {
      // No dejamos la sesión abierta en la puerta del panel
      logout();
      setError("Esta cuenta no tiene permisos de administración.");
      return;
    }

    const destino = sessionStorage.getItem("adminRedirect") || "/admin";
    sessionStorage.removeItem("adminRedirect");

    toast.success("Sesión de administrador iniciada");
    router.replace(destino);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-sm text-emerald-400">Bootcamp</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Panel de administración
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Acceso restringido al equipo que gestiona cursos y categorías.
          </p>
        </div>

        {aviso && (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300">
            {aviso}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-slate-700 bg-slate-800 p-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300"
            >
              Correo
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="username"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@bootcamp.com"
              disabled={loading}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-emerald-800"
          >
            {loading ? "Entrando..." : "Entrar al panel"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Eres estudiante?{" "}
          <Link href="/login" className="text-slate-300 hover:text-white">
            Entra por aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
