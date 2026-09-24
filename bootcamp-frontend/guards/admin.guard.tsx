// src/guards/admin.guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

type Status = "checking" | "authorized";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken, logout } = useAuth();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    // Guarda a dónde quería entrar, para volver ahí después del login.
    const rememberTarget = () => {
      if (pathname && pathname !== "/admin/login") {
        sessionStorage.setItem("adminRedirect", pathname);
      }
    };

    const sendToLogin = (motivo: string) => {
      rememberTarget();
      sessionStorage.setItem("adminMotivo", motivo);
      logout();
      router.replace("/admin/login");
    };

    const verificarSesion = async () => {
      const token = getToken();

      if (!token) {
        sendToLogin("sesion");
        return;
      }

      try {
        // El cliente compartido adjunta el JWT y, si expiró, intenta renovarlo
        // una sola vez antes de considerar la sesión vencida.
        const { data: user } = await api.get("/auth/me");

        if (cancelled) return;

        if (user?.role !== "admin") {
          // Sesión válida pero sin permisos: no le cerramos la sesión,
          // solo lo mandamos a su zona de estudiante.
          sessionStorage.setItem("adminMotivo", "permisos");
          router.replace("/dashboard");
          return;
        }

        setStatus("authorized");
      } catch (error: unknown) {
        if (cancelled) return;

        const statusCode = (
          error as { response?: { status?: number } }
        )?.response?.status;

        sendToLogin(statusCode === 401 ? "expirada" : "conexion");
      }
    };

    verificarSesion();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Mientras verifica NO renderiza children: esto elimina el parpadeo
  // en el que se alcanzaba a ver el panel antes del redirect.
  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400"></div>
          <p className="text-sm text-slate-400">Verificando tu sesión...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
