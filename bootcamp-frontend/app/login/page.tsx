// src/app/login/page.tsx
"use client";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/ui/AnimatedAuth";

export default function LoginPage() {
  return (
    <AuthShell
      titulo="Bienvenido de vuelta"
      subtitulo="Inicia sesión para continuar con tus cursos."
      panel={{
        titulo: "Tu mejor opción",
        resaltado: "Tecnológica",
      }}
    >
      <LoginForm />
    </AuthShell>
  );
}
