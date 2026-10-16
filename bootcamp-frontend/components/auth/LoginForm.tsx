// src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { AuthInput, AuthLabel, PasswordInput, BottomGradient } from "@/components/ui/AnimatedAuth";

export function LoginForm() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success("¡Sesión iniciada correctamente!");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Error al iniciar sesión");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div>
        <AuthLabel htmlFor="email">Correo electrónico</AuthLabel>
        <AuthInput
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div>
        <AuthLabel htmlFor="password">Contraseña</AuthLabel>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Ingresa tu contraseña"
          disabled={loading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[rgba(231,30,36,0.4)] bg-[rgba(231,30,36,0.1)] px-3 py-2.5 text-sm text-[#E31E24]">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button type="submit" disabled={loading} className="group/btn relative btn-red w-full h-11">
        {loading ? "Iniciando sesión..." : <>Iniciar sesión <span aria-hidden>→</span></>}
        <BottomGradient />
      </button>

      {/* Register Link */}
      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <a href="/register" className="font-semibold text-[#00C0E7] hover:underline">
          Regístrate aquí
        </a>
      </p>
    </form>
  );
}
