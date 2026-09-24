import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh"];

const isAuthRoute = (url?: string) =>
  Boolean(url && AUTH_ROUTES.some((route) => url.includes(route)));

const readStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
};

export const getAccessToken = () => readStorage("accessToken");
export const getRefreshToken = () => readStorage("refreshToken");

export const clearStoredSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("refreshToken");
  window.localStorage.removeItem("user");
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;

  const { pathname } = window.location;
  const isAdminArea = pathname.startsWith("/admin");
  const target = isAdminArea ? "/admin/login" : "/login";

  if (pathname === target || pathname === "/register") return;

  if (isAdminArea && pathname !== "/admin/login") {
    window.sessionStorage.setItem("adminRedirect", pathname);
    window.sessionStorage.setItem("adminMotivo", "expirada");
  }

  window.location.assign(target);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (isAuthRoute(config.url)) return config;

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No hay refresh token disponible");
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        if (!data.accessToken) {
          throw new Error("El backend no devolvió un access token");
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem("accessToken", data.accessToken);
          if (data.refreshToken) {
            window.localStorage.setItem("refreshToken", data.refreshToken);
          }
        }

        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRoute(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch {
      clearStoredSession();
      redirectToLogin();
      return Promise.reject(error);
    }
  },
);
