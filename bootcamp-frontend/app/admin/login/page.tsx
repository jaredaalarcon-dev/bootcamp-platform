// src/app/admin/login/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import toast from "react-hot-toast";

const MENSAJES: Record<string, string> = {
  sesion:   "Inicia sesión para entrar al panel.",
  expirada: "Tu sesión expiró. Vuelve a iniciar sesión.",
  conexion: "No se pudo contactar al servidor.",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, loading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [aviso, setAviso]     = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const motivo = sessionStorage.getItem("adminMotivo");
    if (motivo) { setAviso(MENSAJES[motivo] ?? null); sessionStorage.removeItem("adminMotivo"); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { setError("Escribe tu correo y contraseña."); return; }
    const result = await login(formData.email, formData.password);
    if (!result.success) { setError(result.error || "No pudimos iniciar tu sesión."); return; }
    if (result.data?.user?.role !== "admin") { logout(); setError("Esta cuenta no tiene permisos de administración."); return; }
    const destino = sessionStorage.getItem("adminRedirect") || "/admin";
    sessionStorage.removeItem("adminRedirect");
    toast.success("Sesión de administrador iniciada");
    router.replace(destino);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-2">
          <h1 className="font-brand text-[#00C0E7] text-3xl uppercase tracking-wide">
            Soluciones Integrales JB
          </h1>
          <p className="text-white font-bold text-lg">Bootcamp</p>
        </div>
        <div className="line-red mb-6" />

        <div className="bg-card border border-[rgba(0,192,231,0.2)] rounded-xl px-6 py-7">
          <h2 className="text-white text-xl font-semibold text-center mb-1">Panel de administración</h2>
          <p className="text-gray-400 text-xs text-center mb-5">Acceso restringido al equipo que gestiona cursos y categorías.</p>

          {aviso && (
            <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-300">{aviso}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Correo</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="admin@bootcamp.com" disabled={loading}
                className="input-brand disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••" disabled={loading}
                className="input-brand disabled:opacity-60" />
            </div>
            {error && <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={loading} className="btn-red w-full disabled:opacity-60">
              {loading ? "Entrando..." : "Entrar al panel"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Eres estudiante?{" "}
          <Link href="/login" className="text-[#00C0E7] hover:underline">Entra por aquí</Link>
        </p>
      </div>
    </div>
  );
}
