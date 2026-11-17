// src/components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [acepta, setAcepta] = useState(false);

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

    if (!acepta) {
      toast.error("Debes aceptar los Términos y Condiciones y la Política de Privacidad");
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      acepta,
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

      {/* Aceptación de términos (obligatoria) */}
      <label htmlFor="acepta" className="group flex cursor-pointer items-start gap-3 rounded-xl border border-[rgba(0,192,231,0.18)] bg-[rgba(0,192,231,0.04)] p-3 text-sm leading-snug text-gray-400 transition-colors hover:border-[rgba(0,192,231,0.4)]">
        <input
          id="acepta"
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          disabled={loading}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#00C0E7]"
        />
        <span>
          He leído y acepto los{" "}
          <Link href="/terminos" target="_blank" className="font-semibold text-[#00C0E7] hover:underline">Términos y Condiciones</Link>{" "}
          y la{" "}
          <Link href="/privacidad" target="_blank" className="font-semibold text-[#00C0E7] hover:underline">Política de Privacidad</Link>,
          y autorizo el tratamiento de mis datos personales.
        </span>
      </label>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[rgba(231,30,36,0.4)] bg-[rgba(231,30,36,0.1)] px-3 py-2.5 text-sm text-[#E31E24]">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button type="submit" disabled={loading || !acepta} className="group/btn relative btn-red w-full h-11 !mt-6 disabled:cursor-not-allowed disabled:opacity-50">
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
