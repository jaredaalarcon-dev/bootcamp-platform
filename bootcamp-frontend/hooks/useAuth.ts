import { useState } from "react";
import axios from "axios";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string; // ← Agrega esta línea
  };
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<LoginResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          email,
          password,
        },
      );

      const { accessToken, refreshToken, user } = response.data;

      // Guardar tokens en localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      setLoading(false);
      return { success: true, data: response.data };
    } catch (err: any) {
      const rawMessage =
        err.response?.data?.message || "Error al iniciar sesión";
      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;

      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          email,
          password,
          firstName,
          lastName,
        },
      );

      setLoading(false);
      return { success: true, data: response.data };
    } catch (err: any) {
      // Manejar el error si NestJS devuelve un arreglo de validaciones
      const rawMessage = err.response?.data?.message || "Error al registrarse";
      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;

      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setError(null);
  };

  const getUser = () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  };

  const getToken = () => {
    return localStorage.getItem("accessToken");
  };

  return {
    login,
    register,
    logout,
    getUser,
    getToken,
    loading,
    error,
  };
}
