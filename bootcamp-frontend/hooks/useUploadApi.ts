// src/hooks/useUploadApi.ts
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export function useUploadApi() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Con FormData, axios detecta multipart/form-data automáticamente.
      // No ponemos Content-Type manualmente: el browser necesita incluir
      // el boundary, y si lo fijamos a mano lo borra.
      const { data } = await apiClient.post("/upload/image", formData);
      return { success: true, url: data.url as string };
    } catch (err: any) {
      const mensaje =
        err?.response?.data?.message || "No se pudo subir la imagen";
      setUploadError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, uploadError };
}
