// src/lib/comprimir-imagen.ts
// Reduce el peso de una imagen en el navegador antes de subirla:
// la achica a un ancho máximo y la convierte a WebP. Si el resultado no
// pesa menos que el original, se sube el original. Los GIF no se tocan
// (perderían la animación).

export async function comprimirImagen(file: File, anchoMax = 1600, calidad = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error("No se pudo leer la imagen"));
      i.src = url;
    });
    const escala = Math.min(1, anchoMax / img.naturalWidth);
    const w = Math.round(img.naturalWidth * escala);
    const h = Math.round(img.naturalHeight * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", calidad));
    // Algunos navegadores antiguos no generan WebP: devuelven PNG. En ese caso no conviene.
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    const nombre = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], nombre, { type: "image/webp" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
