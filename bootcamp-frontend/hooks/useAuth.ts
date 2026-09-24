import { useState } from "react";
import { api, clearStoredSession, getAccessToken } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      return { success: true, data: response.data };
    } catch (err: any) {
      const rawMessage =
        err.response?.data?.message || "Error al iniciar sesión";
      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
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
      const response = await api.post("/auth/register", {
        email,
        password,
        firstName,
        lastName,
      });

      return { success: true, data: response.data };
    } catch (err: any) {
      const rawMessage = err.response?.data?.message || "Error al registrarse";
      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearStoredSession();
    setError(null);
  };

  const getUser = (): AuthUser | null => {
    try {
      const user = localStorage.getItem("user");
      return user ? (JSON.parse(user) as AuthUser) : null;
    } catch {
      return null;
    }
  };

  const getToken = () => getAccessToken();

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
