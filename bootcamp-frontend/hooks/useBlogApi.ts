// src/hooks/useBlogApi.ts
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export type RedBlog = "facebook" | "instagram" | "youtube" | "tiktok" | "linkedin" | "github" | "noticia";

export interface ItemBlog {
  id: string;
  title: string;
  summary: string | null;
  network: RedBlog;
  category: string | null;
  imageUrl: string | null;
  url: string;
  publishedAt: string;
  auto: boolean;
}

export interface PostBlog extends Omit<ItemBlog, "auto"> {
  isPublished: boolean;
  createdAt: string;
}

export interface VideoYoutube {
  videoId: string;
  title: string;
  summary: string;
  imageUrl: string;
  url: string;
  publishedAt: string;
  /** Ya está publicado en el blog */
  added: boolean;
}

export interface DatosPost {
  title: string;
  summary?: string;
  network: RedBlog;
  category?: string;
  imageUrl?: string;
  url: string;
  publishedAt?: string;
  isPublished?: boolean;
}

export const REDES_BLOG: { value: RedBlog; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "noticia", label: "Noticia" },
];

const mensaje = (err: any, porDefecto: string) => {
  const m = err?.response?.data?.message;
  return Array.isArray(m) ? m.join(". ") : m || porDefecto;
};

export function useBlogApi() {
  const [loading, setLoading] = useState(false);

  // ── Público ────────────────────────────────────────────────────────────
  const getFeed = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/blog/feed");
      return { success: true, items: (data?.data?.items ?? []) as ItemBlog[] };
    } catch (err: any) {
      return { success: false, items: [] as ItemBlog[], error: mensaje(err, "No se pudo cargar el blog") };
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (email: string) => {
    try {
      await apiClient.post("/blog/subscribe", { email });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo completar la suscripción") };
    }
  };

  // ── Admin ──────────────────────────────────────────────────────────────
  const getPosts = async () => {
    try {
      const { data } = await apiClient.get("/blog/posts");
      return { success: true, data: (data?.data ?? []) as PostBlog[] };
    } catch (err: any) {
      return { success: false, data: [] as PostBlog[], error: mensaje(err, "No se pudieron cargar las publicaciones") };
    }
  };

  const createPost = async (datos: DatosPost) => {
    try {
      const { data } = await apiClient.post("/blog/posts", datos);
      return { success: true, data: data?.data as PostBlog };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo guardar la publicación") };
    }
  };

  const updatePost = async (id: string, datos: Partial<DatosPost>) => {
    try {
      const { data } = await apiClient.patch(`/blog/posts/${id}`, datos);
      return { success: true, data: data?.data as PostBlog };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo actualizar la publicación") };
    }
  };

  const deletePost = async (id: string) => {
    try {
      await apiClient.delete(`/blog/posts/${id}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mensaje(err, "No se pudo eliminar la publicación") };
    }
  };

  const getYoutube = async () => {
    try {
      const { data } = await apiClient.get("/blog/youtube");
      return { success: true, data: (data?.data ?? []) as VideoYoutube[] };
    } catch (err: any) {
      return { success: false, data: [] as VideoYoutube[], error: mensaje(err, "No se pudieron leer los videos de YouTube") };
    }
  };

  const getSubscribers = async () => {
    try {
      const { data } = await apiClient.get("/blog/subscribers");
      return { success: true, data: (data?.data ?? []) as { id: string; email: string; createdAt: string }[] };
    } catch (err: any) {
      return { success: false, data: [], error: mensaje(err, "No se pudieron cargar los suscriptores") };
    }
  };

  return { getFeed, subscribe, getPosts, createPost, updatePost, deletePost, getSubscribers, getYoutube, loading };
}
