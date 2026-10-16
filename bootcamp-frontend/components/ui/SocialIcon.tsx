// src/components/ui/SocialIcon.tsx
// Íconos de redes sociales (SVG propios, sin librerías externas).
import type { RedSocial } from "@/lib/social";

const P: Record<RedSocial, React.ReactNode> = {
  facebook: (
    <path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z" />
  ),
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth={1.9}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
    </g>
  ),
  youtube: (
    <g>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="currentColor" />
      <path d="M10 9.2v5.6l4.8-2.8z" fill="var(--icono-fondo, #fff)" />
    </g>
  ),
  linkedin: (
    <g fill="currentColor">
      <rect x="4" y="9.5" width="3.2" height="10" rx="0.4" />
      <circle cx="5.6" cy="5.8" r="1.9" />
      <path d="M10 9.5h3v1.4c.5-.9 1.7-1.7 3.4-1.7 3 0 3.6 2 3.6 4.5v5.8h-3.2v-5.1c0-1.3-.1-2.6-1.7-2.6s-1.9 1.2-1.9 2.5v5.2H10z" />
    </g>
  ),
  tiktok: (
    <path fill="currentColor" d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v3a7 7 0 0 1-3.8-1.2v6.1a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.8 2.5V3z" />
  ),
  whatsapp: (
    <g>
      <path fill="currentColor" d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L3 21l4.4-1.1A9.2 9.2 0 1 0 12 2.8z" />
      <path fill="var(--icono-fondo, #fff)" d="M9.1 7.5c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s.9 2.5 1 2.7c.2.2 1.8 2.8 4.4 3.8 2.1.8 2.6.7 3 .6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1a6.9 6.9 0 0 1-3.4-3c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.9z" />
    </g>
  ),
  github: (
    <path fill="currentColor" transform="translate(4 4)" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  ),
  email: (
    <g fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3.8 7l8.2 6 8.2-6" />
    </g>
  ),
};

/** Ícono de red social. Con `tile` se muestra dentro de un cuadro con el color de la red. */
export function SocialIcon({
  red,
  color,
  tile = false,
  className = "w-5 h-5",
}: {
  red: RedSocial;
  color?: string;
  tile?: boolean;
  className?: string;
}) {
  const svg = (
    <svg viewBox="0 0 24 24" className={tile ? "w-5 h-5" : className} aria-hidden style={!tile && color ? { color } : undefined}>
      {P[red]}
    </svg>
  );
  if (!tile) return svg;
  return (
    <span
      className={`keep-theme inline-flex items-center justify-center rounded-lg text-white shrink-0 ${className}`}
      style={{ backgroundColor: color, ["--icono-fondo" as string]: color } as React.CSSProperties}
    >
      {svg}
    </span>
  );
}
