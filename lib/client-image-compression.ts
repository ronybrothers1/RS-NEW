"use client";

export type NewsImageCompressionResult = {
  file: File;
  optimized: boolean;
  originalBytes: number;
  outputBytes: number;
};

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

const NEWS_MAX_OUTPUT_BYTES = 300 * 1024;
const NEWS_MAX_LONG_EDGE = 1600;

const NEWS_RESOLUTION_FACTORS = [
  1,
  0.9,
  0.8,
  0.7,
  0.6,
  0.5,
  0.4,
  0.3,
] as const;

const NEWS_QUALITY_STEPS = [0.82, 0.76, 0.7, 0.64] as const;
const NEWS_EMERGENCY_QUALITY_STEPS = [0.58, 0.52, 0.46, 0.4] as const;

function originalResult(file: File): NewsImageCompressionResult {
  return {
    file,
    optimized: false,
    originalBytes: file.size,
    outputBytes: file.size,
  };
}

function webpFilename(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "") || "image";
  return `${base}.webp`;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      try {
        const bitmap = await createImageBitmap(file);

        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          dispose: () => bitmap.close(),
        };
      } catch {
        // Fallback ke HTMLImageElement di bawah.
      }
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
      image.src = objectUrl;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Gagal membuat hasil optimasi gambar."));
      },
      "image/webp",
      quality,
    );
  });
}

function renderCanvas(
  decoded: DecodedImage,
  longEdge: number,
): HTMLCanvasElement {
  const originalLongEdge = Math.max(decoded.width, decoded.height);
  const scale = Math.min(1, longEdge / originalLongEdge);

  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Browser tidak mendukung optimasi gambar.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(decoded.source, 0, 0, width, height);

  return canvas;
}

function buildLongEdgeCandidates(originalLongEdge: number): number[] {
  const baseLongEdge = Math.min(originalLongEdge, NEWS_MAX_LONG_EDGE);
  const candidates = NEWS_RESOLUTION_FACTORS.map((factor) =>
    Math.max(1, Math.round(baseLongEdge * factor)),
  );

  return [...new Set(candidates)];
}

async function encodeBelowLimit(
  decoded: DecodedImage,
): Promise<Blob> {
  const originalLongEdge = Math.max(decoded.width, decoded.height);
  const longEdgeCandidates = buildLongEdgeCandidates(originalLongEdge);

  let smallestBlob: Blob | null = null;
  let finalCanvas: HTMLCanvasElement | null = null;

  for (const longEdge of longEdgeCandidates) {
    const canvas = renderCanvas(decoded, longEdge);
    finalCanvas = canvas;

    for (const quality of NEWS_QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, quality);

      if (!smallestBlob || blob.size < smallestBlob.size) {
        smallestBlob = blob;
      }

      if (blob.size < NEWS_MAX_OUTPUT_BYTES) {
        return blob;
      }
    }
  }

  if (finalCanvas) {
    for (const quality of NEWS_EMERGENCY_QUALITY_STEPS) {
      const blob = await canvasToBlob(finalCanvas, quality);

      if (!smallestBlob || blob.size < smallestBlob.size) {
        smallestBlob = blob;
      }

      if (blob.size < NEWS_MAX_OUTPUT_BYTES) {
        return blob;
      }
    }
  }

  throw new Error(
    smallestBlob
      ? `Gambar belum dapat diperkecil di bawah 300 KB (hasil terkecil ${Math.ceil(
          smallestBlob.size / 1024,
        )} KB).`
      : "Gambar belum dapat diperkecil di bawah 300 KB.",
  );
}

export async function compressNewsImage(
  file: File,
): Promise<NewsImageCompressionResult> {
  const originalBytes = file.size;

  // File yang sudah di bawah batas tidak dikompresi ulang.
  if (originalBytes < NEWS_MAX_OUTPUT_BYTES) {
    return originalResult(file);
  }

  let decoded: DecodedImage | null = null;

  try {
    decoded = await decodeImage(file);

    if (
      !Number.isFinite(decoded.width) ||
      !Number.isFinite(decoded.height) ||
      decoded.width <= 0 ||
      decoded.height <= 0
    ) {
      throw new Error("Dimensi gambar tidak valid.");
    }

    const outputBlob = await encodeBelowLimit(decoded);

    if (outputBlob.size >= NEWS_MAX_OUTPUT_BYTES) {
      throw new Error("Hasil optimasi masih mencapai 300 KB atau lebih.");
    }

    const outputFile = new File([outputBlob], webpFilename(file.name), {
      type: "image/webp",
      lastModified: file.lastModified,
    });

    return {
      file: outputFile,
      optimized: true,
      originalBytes,
      outputBytes: outputFile.size,
    };
  } catch (error) {
    // Untuk file >=300 KB, jangan fail-open ke file asli karena akan
    // melanggar batas storage yang disepakati.
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Gagal mengoptimalkan gambar di bawah 300 KB.");
  } finally {
    decoded?.dispose();
  }
}
