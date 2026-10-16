// src/components/ui/ThemeSync.tsx
// Mantiene la clase del tema en <html>.
// El script de layout.tsx la pone antes de pintar, pero si React vuelve a
// renderizar la raíz (por ejemplo al recuperarse de una diferencia de
// hidratación) puede borrarla. Este componente la restaura al instante.
"use client";

import { useLayoutEffect } from "react";
import { THEME_KEY, Tema } from "@/hooks/useTheme";

function guardado(): Tema {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function restaurar() {
  const html = document.documentElement;
  if (html.classList.contains("light") || html.classList.contains("dark")) return;
  const t = guardado();
  html.classList.add(t);
  html.style.colorScheme = t;
}

export function ThemeSync() {
  useLayoutEffect(() => {
    restaurar();
    const obs = new MutationObserver(restaurar);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return null;
}
