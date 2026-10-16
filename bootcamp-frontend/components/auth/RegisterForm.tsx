// src/components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { AuthInput, AuthLabel, PasswordInput, BottomGradient } from "@/components/ui/AnimatedAuth";

export function RegisterForm() {
  const router = useRouter();
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    // Validaciones
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
    );

    if (result.success) {
      toast.success("¡Cuenta creada correctamente! Iniciando sesión...");
      // Aquí podrías hacer login automático si lo deseas
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      toast.error(result.error || "Error al crear cuenta");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre y apellido */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <AuthLabel htmlFor="firstName">Nombre</AuthLabel>
          <AuthInput
            type="text"
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Juan"
            disabled={loading}
          />
        </div>
        <div>
          <AuthLabel htmlFor="lastName">Apellido</AuthLabel>
          <AuthInput
            type="text"
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Pérez"
            disabled={loading}
          />
        </div>
      </div>

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
        <AuthLabel htmlFor="password">Contraseña <span className="font-normal text-gray-500">(mín. 8 caracteres)</span></AuthLabel>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Crea una contraseña"
          disabled={loading}
        />
      </div>

      {/* Confirm Password */}
      <div>
        <AuthLabel htmlFor="confirmPassword">Confirmar contraseña</AuthLabel>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repite tu contraseña"
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
      <button type="submit" disabled={loading} className="group/btn relative btn-red w-full h-11 !mt-6">
        {loading ? "Creando cuenta..." : <>Crear cuenta <span aria-hidden>→</span></>}
        <BottomGradient />
      </button>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="font-semibold text-[#00C0E7] hover:underline">
          Inicia sesión aquí
        </a>
      </p>
    </form>
  );
}
