"use client";

import {
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

type InitialPhoto = {
  id: string;
  url: string;
  pathname: string;
};

type PhotoState = {
  id?: string;
  url: string;
  pathname: string;
  previewUrl: string;
  originalName: string;
  persisted: boolean;
};

const MAX_PHOTOS = 5;
const MIN_PHOTOS = 2;
const MAX_FILE_SIZE =
  5 * 1024 * 1024;
const DRIVE_CHUNK_SIZE =
  1024 * 1024;
const SESSION_TIMEOUT_MS =
  30 * 1000;
const CHUNK_TIMEOUT_MS =
  2 * 60 * 1000;

const ALLOWED_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

type UploadSessionResponse = {
  uploadTicket?: string;
  error?: string;
};

type UploadChunkResponse = {
  complete?: boolean;
  url?: string;
  pathname?: string;
  nextStart?: number;
  error?: string;
};

async function createUploadSession(
  file: File,
) {
  const controller =
    new AbortController();
  const timeout =
    window.setTimeout(
      () => controller.abort(),
      SESSION_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        "/api/akun/pengajuan/media/session",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              filename:
                file.name,
              contentType:
                file.type,
              size:
                file.size,
            }),
          signal:
            controller.signal,
        },
      );

    const result =
      (await response
        .json()
        .catch(() => null)) as
        UploadSessionResponse | null;

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "Gagal menyiapkan upload foto.",
      );
    }

    if (!result?.uploadTicket) {
      throw new Error(
        "Sesi upload foto tidak valid.",
      );
    }

    return result.uploadTicket;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        "Server terlalu lama menyiapkan upload foto. Periksa koneksi lalu coba lagi.",
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function uploadChunk(
  uploadTicket: string,
  file: File,
  chunk: Blob,
  start: number,
  onProgress: (
    percentage: number,
  ) => void,
) {
  return new Promise<UploadChunkResponse>(
    (resolve, reject) => {
      const request =
        new XMLHttpRequest();

      request.open(
        "POST",
        "/api/akun/pengajuan/media/upload?mode=chunk",
      );
      request.timeout =
        CHUNK_TIMEOUT_MS;
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
        (event) => {
          if (!event.lengthComputable) {
            return;
          }

          const uploaded =
            start + event.loaded;

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
        () => reject(
          new Error(
            "Koneksi upload foto terputus.",
          ),
        );

      request.ontimeout =
        () => reject(
          new Error(
            "Upload foto terlalu lama. Periksa koneksi lalu coba lagi.",
          ),
        );

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
            result = null;
          }

          if (
            request.status < 200 ||
            request.status >= 300
          ) {
            reject(
              new Error(
                result?.error ||
                  `Upload foto gagal (HTTP ${request.status}).`,
              ),
            );
            return;
          }

          if (!result) {
            reject(
              new Error(
                "Respons upload foto tidak valid.",
              ),
            );
            return;
          }

          resolve(result);
        };

      request.send(chunk);
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

  while (start < file.size) {
    const end =
      Math.min(
        start +
          DRIVE_CHUNK_SIZE,
        file.size,
      );

    const result =
      await uploadChunk(
        uploadTicket,
        file,
        file.slice(start, end),
        start,
        onProgress,
      );

    if (result.complete) {
      if (
        typeof result.url !==
          "string" ||
        !result.url ||
        typeof result.pathname !==
          "string" ||
        !result.pathname ||
        end !== file.size
      ) {
        throw new Error(
          "Google Drive mengembalikan hasil upload yang tidak valid.",
        );
      }

      onProgress(100);

      return {
        url:
          result.url,
        pathname:
          result.pathname,
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
      nextStart <= start ||
      nextStart > file.size ||
      nextStart %
        (256 * 1024) !==
        0
    ) {
      throw new Error(
        "Status upload Google Drive tidak valid.",
      );
    }

    start = nextStart;
  }

  throw new Error(
    "Google Drive tidak menyelesaikan upload foto.",
  );
}

async function cleanupPhoto(
  photo: Pick<
    PhotoState,
    "url" | "pathname"
  >,
) {
  const response =
    await fetch(
      "/api/akun/pengajuan/media/upload",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            url:
              photo.url,
            pathname:
              photo.pathname,
          }),
      },
    );

  if (!response.ok) {
    const payload =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      payload?.error ||
        "Foto belum dapat dihapus.",
    );
  }
}

export default function AssistancePhotoUploader({
  userId: _userId,
  initialPhotos = [],
  onPhotoCountChange,
  onUploadingChange,
}: {
  userId: string;
  initialPhotos?: InitialPhoto[];
  onPhotoCountChange?: (
    count: number,
  ) => void;
  onUploadingChange?: (
    uploading: boolean,
  ) => void;
}) {
  const [photos, setPhotos] =
    useState<PhotoState[]>(
      initialPhotos.map(
        (photo, index) => ({
          ...photo,
          previewUrl:
            `/api/akun/pengajuan/media/${photo.id}`,
          originalName:
            `Foto ${index + 1}`,
          persisted: true,
        }),
      ),
    );

  const [uploading, setUploading] =
    useState(false);
  const [progress, setProgress] =
    useState(0);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    onPhotoCountChange?.(
      photos.length,
    );
  }, [
    photos.length,
    onPhotoCountChange,
  ]);

  async function handleFiles(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selected =
      Array.from(
        event.target.files || [],
      );

    event.target.value = "";

    if (selected.length === 0) {
      return;
    }

    setError(null);

    if (
      photos.length +
        selected.length >
      MAX_PHOTOS
    ) {
      setError(
        `Maksimal ${MAX_PHOTOS} foto untuk satu pengajuan.`,
      );
      return;
    }

    for (const file of selected) {
      if (
        !ALLOWED_TYPES.has(
          file.type,
        )
      ) {
        setError(
          "Foto harus berformat JPG, PNG, atau WebP.",
        );
        return;
      }

      if (
        file.size <= 0 ||
        file.size >
          MAX_FILE_SIZE
      ) {
        setError(
          "Ukuran setiap foto maksimal 5 MB.",
        );
        return;
      }
    }

    setUploading(true);
    onUploadingChange?.(true);
    setProgress(0);

    const completed:
      PhotoState[] = [];

    try {
      for (
        let index = 0;
        index < selected.length;
        index++
      ) {
        const file =
          selected[index];
        const previewUrl =
          URL.createObjectURL(file);

        try {
          const uploadTicket =
            await createUploadSession(
              file,
            );

          const result =
            await uploadToGoogleDrive(
              uploadTicket,
              file,
              (fileProgress) => {
                const totalProgress =
                  Math.round(
                    (
                      index * 100 +
                      fileProgress
                    ) /
                      selected.length,
                  );

                setProgress(
                  totalProgress,
                );
              },
            );

          completed.push({
            url:
              result.url,
            pathname:
              result.pathname,
            previewUrl,
            originalName:
              file.name,
            persisted: false,
          });
        } catch (uploadError) {
          URL.revokeObjectURL(
            previewUrl,
          );
          throw uploadError;
        }
      }

      setPhotos(
        (current) => [
          ...current,
          ...completed,
        ],
      );
      setProgress(100);
    } catch (uploadError) {
      console.error(
        "Photo upload error:",
        uploadError,
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Foto belum dapat diunggah.",
      );

      for (const photo of completed) {
        await cleanupPhoto(photo)
          .catch(() => undefined);
        URL.revokeObjectURL(
          photo.previewUrl,
        );
      }
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  async function removePhoto(
    photo: PhotoState,
  ) {
    setError(null);

    if (photo.persisted) {
      setPhotos(
        (current) =>
          current.filter(
            (item) =>
              item.id !== photo.id,
          ),
      );
      return;
    }

    try {
      await cleanupPhoto(photo);

      setPhotos(
        (current) =>
          current.filter(
            (item) =>
              item.pathname !==
              photo.pathname,
          ),
      );
      URL.revokeObjectURL(
        photo.previewUrl,
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Foto belum dapat dihapus.",
      );
    }
  }

  const enoughPhotos =
    photos.length >=
    MIN_PHOTOS;

  return (
    <div className="space-y-4">
      <input
        type="hidden"
        name="uploadedPhotos"
        value={JSON.stringify(
          photos.map(
            ({
              id,
              url,
              pathname,
            }) => ({
              id,
              url,
              pathname,
            }),
          ),
        )}
      />

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
            <ImagePlus className="h-6 w-6" />
          </div>

          <p className="mt-3 font-semibold text-slate-900">
            Foto kondisi saat ini
          </p>

          <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
            Unggah 2–5 foto yang memperlihatkan kondisi calon penerima secara jelas. JPG, PNG, atau WebP, maksimal 5 MB per foto.
          </p>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">
            <ImagePlus className="h-4 w-4" />
            Pilih Foto
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={
                uploading ||
                photos.length >=
                  MAX_PHOTOS
              }
              onChange={handleFiles}
              className="sr-only"
            />
          </label>
        </div>

        {uploading && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Mengunggah foto ke penyimpanan aman
              </span>
              <span>{progress}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-teal-700 transition-all"
                style={{
                  width:
                    `${progress}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map(
            (photo, index) => (
              <div
                key={
                  photo.id ||
                  photo.pathname
                }
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview or authenticated private media */}
                  <img
                    src={
                      photo.previewUrl
                    }
                    alt={`Foto pengajuan ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="truncate text-xs text-slate-500">
                    Foto {index + 1}
                  </span>

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() =>
                      removePhoto(photo)
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    aria-label={`Hapus foto ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <div
        className={`text-sm ${
          enoughPhotos
            ? "text-emerald-700"
            : "text-slate-500"
        }`}
      >
        {photos.length} dari {MAX_PHOTOS} foto.
        {!enoughPhotos &&
          ` Minimal ${MIN_PHOTOS} foto diperlukan sebelum pengajuan dikirim.`}
      </div>
    </div>
  );
}
