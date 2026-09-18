// src/courses/utils/video-url.ts

/**
 * Convierte cualquier enlace de YouTube o Vimeo al formato que sí
 * se puede incrustar en un <iframe>. Un enlace de YouTube normal
 * (youtube.com/watch?v=...) devuelve un iframe en negro porque la
 * cabecera X-Frame-Options lo bloquea.
 *
 * Si no reconoce el formato, devuelve la URL tal cual: puede ser un
 * MP4 propio, un Loom, o cualquier otro reproductor.
 */
export function aUrlIncrustable(url: string): string {
  const limpia = url.trim();

  const patronesYoutube = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
  ];

  for (const patron of patronesYoutube) {
    const encontrado = limpia.match(patron);
    if (encontrado) {
      return `https://www.youtube.com/embed/${encontrado[1]}`;
    }
  }

  const vimeo = limpia.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }

  return limpia;
}
