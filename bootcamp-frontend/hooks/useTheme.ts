// src/hooks/useTheme.ts
// Tema claro/oscuro de la plataforma.
// La clase ("dark" | "light") vive en <html> y la pone un script en layout.tsx
// ANTES de pintar la página, así no hay parpadeo. Aquí solo se lee y se cambia.
"use client";

import { useCallback, useEffect, useState } from "react";

export type Tema = "dark" | "light";
export const THEME_KEY = "sijb-theme";
const EVENTO = "sijb-theme-change";

function temaActual(): Tema {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function aplicarTema(tema: Tema) {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(tema);
  html.style.colorScheme = tema;
  try { localStorage.setItem(THEME_KEY, tema); } catch {}
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: tema }));
}

export function useTheme() {
  const [tema, setTema] = useState<Tema>("dark");

  useEffect(() => {
    setTema(temaActual());
    const sync = () => setTema(temaActual());
    window.addEventListener(EVENTO, sync);
    // Si el usuario cambia el tema en otra pestaña
    const storage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        aplicarTema(e.newValue);
      }
    };
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(EVENTO, sync);
      window.removeEventListener("storage", storage);
    };
  }, []);

  const toggle = useCallback(() => {
    aplicarTema(temaActual() === "dark" ? "light" : "dark");
  }, []);

  return { tema, toggle, esClaro: tema === "light" };
}
