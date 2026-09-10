"use client";
/* eslint-disable @next/next/no-img-element */

import {
  upload,
} from "@vercel/blob/client";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_TYPES =
  [
    "image/jpeg",
    "image/png",
  ];

type UploadState = {
  ready: boolean;
  uploading: boolean;
};

function sanitizeFilename(
  filename: string,
) {
  const extension =
    filename.includes(".")
      ? `.${filename
          .split(".")
          .pop()
          ?.toLowerCase()}`
      : "";

  const base =
    filename
      .replace(
        /\.[^/.]+$/,
        "",
      )
      .toLowerCase()
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        80,
      );

  return `${
    base ||
    "bukti-transfer"
  }${extension}`;
}

export default function DonationProofUploader({
  onStateChange,
}: {
  onStateChange: (
    state:
      UploadState,
  ) => void;
}) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    proofImageUrl,
    setProofImageUrl,
  ] = useState("");

  const [
    proofPathname,
    setProofPathname,
  ] = useState("");

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  function selectFile() {
    if (
      !isUploading
    ) {
      inputRef.current
        ?.click();
    }
  }

  async function deleteBlob(
    pathname: string,
  ) {
    if (!pathname) {
      return;
    }

    try {
      await fetch(
        "/api/donasi/proof/upload",
        {
          method:
            "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(
              {
                pathname,
              },
            ),
        },
      );
    } catch {
      // Cleanup bersifat best effort.
    }
  }

  async function uploadFile(
    file: File,
  ) {
    setError(null);

    if (
      !ALLOWED_TYPES.includes(
        file.type,
      )
    ) {
      setError(
        "Bukti transfer harus berformat JPG atau PNG.",
      );
      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "Ukuran bukti transfer maksimal 5 MB.",
      );
      return;
    }

    setIsUploading(
      true,
    );
    setProgress(0);

    onStateChange({
      ready: false,
      uploading: true,
    });

    const localPreview =
      URL.createObjectURL(
        file,
      );

    try {
      const safeName =
        sanitizeFilename(
          file.name,
        );

      const blob =
        await upload(
          `media/donasi/${Date.now()}-${safeName}`,
          file,
          {
            access:
              "private",
            handleUploadUrl:
              "/api/donasi/proof/upload",
            contentType:
              file.type,
            onUploadProgress:
              ({
                percentage,
              }) => {
                setProgress(
                  Math.round(
                    percentage,
                  ),
                );
              },
          },
        );

      const previousPathname =
        proofPathname;

      const previousPreview =
        previewUrl;

      setProofImageUrl(
        blob.url,
      );

      setProofPathname(
        blob.pathname,
      );

      setPreviewUrl(
        localPreview,
      );

      setProgress(
        100,
      );

      if (
        previousPreview
      ) {
        URL.revokeObjectURL(
          previousPreview,
        );
      }

      if (
        previousPathname
      ) {
        void deleteBlob(
          previousPathname,
        );
      }

      onStateChange({
        ready: true,
        uploading: false,
      });
    } catch (
      uploadError
    ) {
      URL.revokeObjectURL(
        localPreview,
      );

      setError(
        uploadError instanceof
        Error
          ? uploadError.message
          : "Gagal mengunggah bukti transfer.",
      );

      onStateChange({
        ready:
          Boolean(
            proofImageUrl,
          ),
        uploading: false,
      });
    } finally {
      setIsUploading(
        false,
      );
    }
  }

  async function removeProof() {
    if (
      isUploading
    ) {
      return;
    }

    const pathname =
      proofPathname;

    const localPreview =
      previewUrl;

    setProofImageUrl("");
    setProofPathname("");
    setPreviewUrl("");
    setProgress(0);
    setError(null);

    if (
      localPreview
    ) {
      URL.revokeObjectURL(
        localPreview,
      );
    }

    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }

    onStateChange({
      ready: false,
      uploading: false,
    });

    await deleteBlob(
      pathname,
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(
          event,
        ) => {
          const file =
            event.target
              .files?.[0];

          if (file) {
            void uploadFile(
              file,
            );
          }
        }}
      />

      <input
        type="hidden"
        name="proofImageUrl"
        value={
          proofImageUrl
        }
      />

      {!proofImageUrl ? (
        <button
          type="button"
          disabled={
            isUploading
          }
          onClick={
            selectFile
          }
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50/40 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? (
            <>
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-teal-700" />

              <span className="text-sm font-semibold text-slate-800">
                Mengunggah bukti
                transfer...
              </span>

              <span className="mt-1 text-xs text-slate-500">
                {progress}%
              </span>

              <div className="mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all"
                  style={{
                    width:
                      `${progress}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-200">
                <ImagePlus className="h-6 w-6" />
              </div>

              <span className="text-sm font-semibold text-slate-800">
                Pilih bukti
                transfer
              </span>

              <span className="mt-1 text-xs leading-5 text-slate-500">
                JPG atau PNG ·
                maksimal 5 MB
              </span>

              <span className="mt-2 text-xs leading-5 text-slate-400">
                File disimpan pada
                penyimpanan privat dan
                hanya dapat diperiksa
                pengurus.
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="relative bg-slate-100">
            {previewUrl ? (
              <img
                src={
                  previewUrl
                }
                alt="Preview bukti transfer"
                className="max-h-[420px] w-full object-contain"
              />
            ) : (
              <div className="flex min-h-52 items-center justify-center text-sm text-slate-500">
                Bukti transfer
                tersimpan secara
                privat.
              </div>
            )}

            <div className="absolute right-3 top-3 flex gap-2">
              <button
                type="button"
                onClick={
                  selectFile
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-slate-700 shadow-sm hover:bg-white"
                title="Ganti bukti transfer"
                aria-label="Ganti bukti transfer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  void removeProof()
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-rose-600 shadow-sm hover:bg-white"
                title="Hapus bukti transfer"
                aria-label="Hapus bukti transfer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Bukti transfer
            berhasil diunggah
            secara privat.
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}
    </div>
  );
}
