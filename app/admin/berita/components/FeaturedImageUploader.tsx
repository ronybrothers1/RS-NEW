"use client";

import { upload } from "@vercel/blob/client";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function sanitizeFilename(filename: string) {
  const extension = filename.includes(".")
    ? `.${filename.split(".").pop()?.toLowerCase()}`
    : "";

  const base = filename
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "gambar"}${extension}`;
}

export default function FeaturedImageUploader({ initialUrl = "" }: { initialUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState(initialUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectFile = () => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  };

  const uploadFile = async (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Format gambar harus JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const safeName = sanitizeFilename(file.name);

      const blob = await upload(
        `media/berita/${Date.now()}-${safeName}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/admin/media/upload",
          contentType: file.type,
          onUploadProgress: ({ percentage }) => {
            setProgress(Math.round(percentage));
          },
        },
      );

      setImageUrl(blob.url);
      setProgress(100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengunggah gambar.",
      );
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadFile(file);
          }
        }}
      />

      <input
        type="hidden"
        name="imageUrl"
        value={imageUrl}
      />

      {!imageUrl ? (
        <button
          type="button"
          disabled={isUploading}
          onClick={selectFile}
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50/40 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? (
            <>
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-teal-700" />

              <span className="text-sm font-semibold text-slate-800">
                Mengunggah gambar...
              </span>

              <span className="mt-1 text-xs text-slate-500">
                {progress}%
              </span>

              <div className="mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-200">
                <ImagePlus className="h-6 w-6" />
              </div>

              <span className="text-sm font-semibold text-slate-800">
                Pilih gambar unggulan
              </span>

              <span className="mt-1 text-xs leading-5 text-slate-500">
                JPG, PNG, atau WebP Â· maksimal 5 MB
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="relative aspect-[16/9] bg-slate-100">
            <img
              src={imageUrl}
              alt="Preview gambar unggulan"
              className="h-full w-full object-cover"
            />

            <div className="absolute right-3 top-3 flex gap-2">
              <button
                type="button"
                onClick={selectFile}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-slate-700 shadow-sm transition hover:bg-white"
                title="Ganti gambar"
                aria-label="Ganti gambar"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-red-600 shadow-sm transition hover:bg-white"
                title="Hapus gambar dari artikel"
                aria-label="Hapus gambar dari artikel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Gambar berhasil diunggah dan siap digunakan.
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}