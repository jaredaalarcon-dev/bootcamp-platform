// src/lib/api-client.ts
//
// Cliente axios compartido por todos los hooks.
// Ventajas sobre crear axios.create() en cada hook:
//   - Un solo lugar para el header Authorization
//   - Interceptor de 401: renueva el token automáticamente
//   - Las peticiones simultáneas que expiran a la vez no generan
//     múltiples refreshes: se encolan y se resuelven de una vez

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// ── Cola para peticiones mientras se renueva el token ──────────────────────
let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  queue = [];
}

// ── Helpers de sesión ───────────────────────────────────────────────────────
function borrarSesion() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

function irAlLogin() {
  if (typeof window === "undefined") return;
  const enAdmin = window.location.pathname.startsWith("/admin");
  window.location.href = enAdmin ? "/admin/login" : "/login";
}

// ── Instancia compartida ────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// REQUEST: adjunta el token a cada petición
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE: maneja el 401 intentando renovar el token una sola vez
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // No reintentar si: no es 401, ya se reintentó, o es una ruta de auth
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar esta petición
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (!refreshToken) {
      isRefreshing = false;
      borrarSesion();
      irAlLogin();
      return Promise.reject(error);
    }

    try {
      // Usamos axios base (no el cliente compartido) para no entrar en bucle
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        { refreshToken },
      );

      const nuevoToken: string = data.accessToken;
      localStorage.setItem("accessToken", nuevoToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

      flushQueue(null, nuevoToken);
      original.headers.Authorization = `Bearer ${nuevoToken}`;
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      borrarSesion();
      irAlLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
