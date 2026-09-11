"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { uploadImage } from "@/app/admin/actions";

export function ImageUploadField({
  imageUrl,
  onChange,
}: {
  imageUrl: string | null;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImage(formData);
    setUploading(false);
    if (result.error || !result.url) {
      setError(result.error ?? "No se pudo subir la imagen.");
      return;
    }
    onChange(result.url);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-50">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <Upload className="h-5 w-5 text-navy-300" />
        )}
      </div>
      <div>
        <label className="focus-ring cursor-pointer text-xs font-semibold text-brand-blue-600 hover:underline">
          {uploading ? "Subiendo…" : "Subir foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        {error && <p className="mt-1 text-[11px] font-medium text-brand-red-600">{error}</p>}
      </div>
    </div>
  );
}
