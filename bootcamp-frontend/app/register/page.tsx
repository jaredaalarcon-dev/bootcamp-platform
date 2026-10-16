// src/app/register/page.tsx
"use client";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/ui/AnimatedAuth";

export default function RegisterPage() {
  return (
    <AuthShell
      titulo="Crea tu cuenta"
      subtitulo="Únete a nuestra comunidad de aprendizaje y comienza hoy."
      panel={{
        titulo: "Empieza a",
        resaltado: "aprender hoy",
        texto: "Accede a cursos con videos, recursos descargables y certificados con ID verificable de Soluciones Integrales JB.",
      }}
    >
      <RegisterForm />
    </AuthShell>
  );
}
