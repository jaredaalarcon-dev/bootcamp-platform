// src/components/admin/ImageUpload.tsx
"use client";

import { useRef, useState } from "react";
import { useUploadApi } from "@/hooks/useUploadApi";
import toast from "react-hot-toast";

interface ImageUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  disabled?: boolean;
}

const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp,image/gif";
const MAX_MB = 5;

export function ImageUpload({ currentUrl, onUpload, disabled }: ImageUploadProps) {
  const { uploadImage, uploading } = useUploadApi();
  const inputRef = useRef<HTMLInputElement>(null);

  // Preview local (ObjectURL) antes de que termine el upload
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview || currentUrl;

  const handleFile = async (file: File) => {
    // Validar tamaño en el cliente para dar feedback inmediato
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`La imagen no puede superar los ${MAX_MB} MB`);
      return;
    }

    // Mostrar preview local de inmediato, sin esperar al servidor
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const resultado = await uploadImage(file);

    // Liberar memoria del ObjectURL
    URL.revokeObjectURL(objectUrl);

    if (!resultado.success || !resultado.url) {
      toast.error(resultado.error || "Error al subir la imagen");
      setPreview(null);
      return;
    }

    // Actualizar preview con la URL pública definitiva
    setPreview(resultado.url);
    onUpload(resultado.url);
    toast.success("Imagen subida correctamente");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Limpiar el input para permitir volver a seleccionar el mismo archivo
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const isDisabled = disabled || uploading;

  return (
    <div className="space-y-3">
      {/* Preview */}
      {displayUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={displayUrl}
            alt="Portada del curso"
            className="h-48 w-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center text-white">
                <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <p className="text-sm font-medium">Subiendo imagen...</p>
              </div>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isDisabled}
              className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 shadow hover:bg-white disabled:opacity-60"
            >
              ✏️ Cambiar imagen
            </button>
          )}
        </div>
      ) : (
        /* Zona de drop cuando no hay imagen */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isDisabled && inputRef.current?.click()}
          className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDisabled
              ? "cursor-not-allowed border-gray-200 bg-gray-50"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {uploading ? (
            <>
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-gray-600">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Arrastra una imagen o{" "}
                <span className="text-blue-600">haz clic para seleccionar</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP o GIF · máx. {MAX_MB} MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_ACEPTADOS}
        onChange={handleInputChange}
        disabled={isDisabled}
        className="hidden"
      />
    </div>
  );
}
