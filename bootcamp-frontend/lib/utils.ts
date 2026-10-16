// src/lib/utils.ts
/** Une clases de Tailwind ignorando valores vacíos (equivalente simple de clsx). */
export function cn(...clases: Array<string | false | null | undefined>) {
  return clases.filter(Boolean).join(" ");
}
