// src/app/admin/login/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import { AuthShell, AuthInput, AuthLabel, PasswordInput, BottomGradient } from "@/components/ui/AnimatedAuth";

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
    <AuthShell
      variante="admin"
      titulo="Panel de administración"
      subtitulo="Acceso restringido al equipo que gestiona la plataforma."
      panel={{
        titulo: "Gestiona tu",
        resaltado: "plataforma",
        texto: "Cursos, contenido, recursos, usuarios, blog y reportes de Soluciones Integrales JB en un solo lugar.",
      }}
      pie={
        <p className="text-center text-sm text-gray-500">
          ¿Eres estudiante?{" "}
          <Link href="/login" className="font-semibold text-[#00C0E7] hover:underline">Entra por aquí</Link>
        </p>
      }
    >
      {aviso && (
        <div className="mb-5 rounded-lg border border-[rgba(0,192,231,0.3)] bg-[rgba(0,192,231,0.08)] px-4 py-3 text-sm text-gray-300">{aviso}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <AuthLabel htmlFor="admin-email">Correo</AuthLabel>
          <AuthInput id="admin-email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange}
            placeholder="admin@solucionesintegralesjb.com" disabled={loading} />
        </div>
        <div>
          <AuthLabel htmlFor="admin-password">Contraseña</AuthLabel>
          <PasswordInput id="admin-password" name="password" autoComplete="current-password" value={formData.password} onChange={handleChange}
            placeholder="Ingresa tu contraseña" disabled={loading} />
        </div>
        {error && (
          <p className="rounded-lg border border-[rgba(231,30,36,0.4)] bg-[rgba(231,30,36,0.1)] px-3 py-2.5 text-sm text-[#E31E24]">{error}</p>
        )}
        <button type="submit" disabled={loading} className="group/btn relative btn-red w-full h-11 disabled:opacity-60">
          {loading ? "Entrando..." : <>Entrar al panel <span aria-hidden>→</span></>}
          <BottomGradient />
        </button>
      </form>
    </AuthShell>
  );
}
