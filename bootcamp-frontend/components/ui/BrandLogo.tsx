// src/components/ui/BrandLogo.tsx
// Logo oficial de Soluciones Integrales JB, usado en toda la plataforma.
// Hay dos versiones con fondo transparente:
//  - OSCURO: eslogan en blanco, para fondos oscuros (modo oscuro, reproductor, certificado)
//  - CLARO:  eslogan en negro, para fondos claros (modo claro)
// Con variant="auto" se muestra la correcta según el tema activo (solo con CSS, sin parpadeo).

export const LOGO_SRC = "/brand/logo-sijb-oscuro.png";
export const LOGO_CLARO_SRC = "/brand/logo-sijb-claro.png";
export const ICONO_SRC = "/brand/icono-sijb.png";

interface BrandLogoProps {
  /** Ancho del logo en píxeles */
  width?: number;
  align?: "left" | "center";
  /** auto = según el tema; dark/light = forzar una versión */
  variant?: "auto" | "dark" | "light";
  className?: string;
}

export function BrandLogo({
  width = 220,
  align = "left",
  variant = "auto",
  className = "",
}: BrandLogoProps) {
  const alineacion = align === "center" ? "justify-center" : "justify-start";
  const estilo = { width, height: "auto" } as const;
  const comun = "select-none max-w-full";

  return (
    <div className={`flex ${alineacion} ${className}`}>
      {variant !== "light" && (
        <img
          src={LOGO_SRC}
          alt="Soluciones Integrales JB"
          width={width}
          style={estilo}
          draggable={false}
          className={`${comun} ${variant === "auto" ? "logo-tema-oscuro" : ""}`}
        />
      )}
      {variant !== "dark" && (
        <img
          src={LOGO_CLARO_SRC}
          alt={variant === "auto" ? "" : "Soluciones Integrales JB"}
          aria-hidden={variant === "auto" ? true : undefined}
          width={width}
          style={estilo}
          draggable={false}
          className={`${comun} ${variant === "auto" ? "logo-tema-claro" : ""}`}
        />
      )}
    </div>
  );
}
