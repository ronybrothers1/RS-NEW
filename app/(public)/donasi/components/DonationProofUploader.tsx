"use client";
/* eslint-disable @next/next/no-img-element */

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

type UploadSessionResponse = {
  uploadTicket?: string;
  error?: string;
};

async function createUploadSession(
  file: File,
  safeName: string,
) {
  const response =
    await fetch(
      "/api/donasi/proof/session",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            filename:
              safeName,
            contentType:
              file.type,
            size:
              file.size,
          }),
      },
    );

  const result =
    (await response
      .json()
      .catch(
        () => null,
      )) as
      UploadSessionResponse | null;

  if (!response.ok) {
    throw new Error(
      result?.error ||
        "Gagal menyiapkan upload bukti transfer.",
    );
  }

  if (
    !result?.uploadTicket
  ) {
    throw new Error(
      "Sesi upload bukti transfer tidak valid.",
    );
  }

  return {
    uploadTicket:
      result.uploadTicket,
  };
}

type CleanupResponse = {
  deleted?: boolean;
  preserved?: boolean;
  error?: string;
};

async function cleanupDonationProof(
  locator: string,
  cleanupTicket: string,
) {
  const response =
    await fetch(
      "/api/donasi/proof/upload?mode=cleanup",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            locator,
            cleanupTicket,
          }),
      },
    );

  const result =
    (await response
      .json()
      .catch(
        () => null,
      )) as
      CleanupResponse | null;

  if (
    !response.ok ||
    result?.deleted !==
      true
  ) {
    throw new Error(
      result?.error ||
        "Bukti transfer lama tidak dapat dibersihkan.",
    );
  }
}

const DRIVE_CHUNK_SIZE =
  1024 * 1024;

type UploadChunkResponse = {
  complete?: boolean;
  locator?: string;
  cleanupTicket?: string;
  nextStart?: number;
  error?: string;
};

function uploadChunkThroughServer(
  uploadTicket: string,
  file: File,
  chunk: Blob,
  start: number,
  onProgress: (
    percentage: number,
  ) => void,
) {
  return new Promise<UploadChunkResponse>(
    (
      resolve,
      reject,
    ) => {
      const request =
        new XMLHttpRequest();

      request.open(
        "POST",
        "/api/donasi/proof/upload?mode=chunk",
      );

      request.setRequestHeader(
        "Content-Type",
        "application/octet-stream",
      );

      request.setRequestHeader(
        "X-Upload-Ticket",
        uploadTicket,
      );

      request.setRequestHeader(
        "X-Upload-Start",
        String(start),
      );

      request.upload.onprogress =
        (
          event,
        ) => {
          if (
            !event.lengthComputable
          ) {
            return;
          }

          const uploaded =
            start +
            event.loaded;

          onProgress(
            Math.min(
              99,
              Math.round(
                (uploaded /
                  file.size) *
                  100,
              ),
            ),
          );
        };

      request.onerror =
        () => {
          reject(
            new Error(
              "Koneksi upload bukti transfer terputus.",
            ),
          );
        };

      request.onload =
        () => {
          let result:
            UploadChunkResponse | null =
              null;

          try {
            result =
              JSON.parse(
                request.responseText,
              ) as UploadChunkResponse;
          } catch {
            result =
              null;
          }

          if (
            request.status < 200 ||
            request.status >= 300
          ) {
            reject(
              new Error(
                result?.error ||
                  `Upload bukti transfer gagal (HTTP ${request.status}).`,
              ),
            );
            return;
          }

          if (!result) {
            reject(
              new Error(
                "Respons upload bukti transfer tidak valid.",
              ),
            );
            return;
          }

          resolve(
            result,
          );
        };

      request.send(
        chunk,
      );
    },
  );
}

async function uploadToGoogleDrive(
  uploadTicket: string,
  file: File,
  onProgress: (
    percentage: number,
  ) => void,
) {
  let start = 0;

  while (
    start <
    file.size
  ) {
    const end =
      Math.min(
        start +
          DRIVE_CHUNK_SIZE,
        file.size,
      );

    const chunk =
      file.slice(
        start,
        end,
      );

    const result =
      await uploadChunkThroughServer(
        uploadTicket,
        file,
        chunk,
        start,
        onProgress,
      );

    if (
      result.complete
    ) {
      if (
        typeof result.locator !==
          "string" ||
        !/^gdrive:[A-Za-z0-9_-]+$/.test(
          result.locator,
        ) ||
        typeof result.cleanupTicket !==
          "string" ||
        !result.cleanupTicket ||
        end !==
          file.size
      ) {
        throw new Error(
          "Google Drive mengembalikan hasil upload yang tidak valid.",
        );
      }

      onProgress(
        100,
      );

      return {
        locator:
          result.locator,
        cleanupTicket:
          result.cleanupTicket,
      };
    }

    const nextStart =
      typeof result.nextStart ===
        "number" &&
      Number.isSafeInteger(
        result.nextStart,
      )
        ? result.nextStart
        : end;

    if (
      nextStart <=
        start ||
      nextStart >
        file.size ||
      nextStart %
        (256 * 1024) !==
        0
    ) {
      throw new Error(
        "Status upload Google Drive tidak valid.",
      );
    }

    start =
      nextStart;
  }

  throw new Error(
    "Google Drive tidak menyelesaikan upload bukti transfer.",
  );
}


export default function DonationProofUploader({
  onStateChange,
  disabled = false,
}: {
  onStateChange: (
    state:
      UploadState,
  ) => void;
  disabled?: boolean;
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
    proofCleanupTicket,
    setProofCleanupTicket,
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
    isCleaning,
    setIsCleaning,
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
      !isUploading &&
      !isCleaning &&
      !disabled
    ) {
      inputRef.current
        ?.click();
    }
  }

  async function uploadFile(
    file: File,
  ) {
    if (disabled) {
      return;
    }

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

    const previousProof =
      proofImageUrl;

    const previousCleanupTicket =
      proofCleanupTicket;

    const previousPreview =
      previewUrl;

    try {
      const safeName =
        sanitizeFilename(
          file.name,
        );

      const {
        uploadTicket,
      } =
        await createUploadSession(
          file,
          safeName,
        );

      const {
        locator:
          nextProofImageUrl,
        cleanupTicket,
      } =
        await uploadToGoogleDrive(
          uploadTicket,
          file,
          (
            percentage,
          ) => {
            setProgress(
              percentage,
            );
          },
        );

      setProofImageUrl(
        nextProofImageUrl,
      );

      setProofCleanupTicket(
        cleanupTicket,
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
        previousProof
      ) {
        if (
          previousCleanupTicket
        ) {
          try {
            await cleanupDonationProof(
              previousProof,
              previousCleanupTicket,
            );
          } catch {
            setError(
              "Bukti baru berhasil diunggah, tetapi bukti lama belum dapat dibersihkan otomatis.",
            );
          }
        } else {
          setError(
            "Bukti baru berhasil diunggah, tetapi izin untuk membersihkan bukti lama tidak tersedia.",
          );
        }
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
      isUploading ||
      isCleaning ||
      disabled ||
      !proofImageUrl
    ) {
      return;
    }

    if (
      !proofCleanupTicket
    ) {
      setError(
        "Izin untuk menghapus bukti transfer tidak tersedia.",
      );
      return;
    }

    setIsCleaning(
      true,
    );
    setError(null);

    onStateChange({
      ready: false,
      uploading: true,
    });

    try {
      await cleanupDonationProof(
        proofImageUrl,
        proofCleanupTicket,
      );

      const localPreview =
        previewUrl;

      setProofImageUrl("");
      setProofCleanupTicket("");
      setPreviewUrl("");
      setProgress(0);

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
    } catch (
      cleanupError
    ) {
      setError(
        cleanupError instanceof
          Error
          ? cleanupError.message
          : "Bukti transfer tidak dapat dihapus.",
      );

      onStateChange({
        ready: true,
        uploading: false,
      });
    } finally {
      setIsCleaning(
        false,
      );
    }
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
            isUploading ||
            isCleaning ||
            disabled
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

              <span className="mt-2 text-xs leading-5 text-slate-600">
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

            <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={
                  isUploading ||
                  isCleaning ||
                  disabled
                }
                onClick={
                  selectFile
                }
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                title="Ganti bukti transfer"
                aria-label="Ganti bukti transfer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Ganti Bukti</span>
              </button>

              <button
                type="button"
                disabled={
                  isUploading ||
                  isCleaning ||
                  disabled
                }
                onClick={
                  removeProof
                }
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                title="Hapus bukti transfer"
                aria-label="Hapus bukti transfer"
              >
                <X className="h-4 w-4" />
                <span>Hapus Bukti</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-emerald-700">
            {isCleaning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menghapus bukti
                transfer...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Bukti transfer
                berhasil diunggah
                secara privat.
              </>
            )}
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
