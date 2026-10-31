import type { PDFFont } from "pdf-lib";

/*
 * Font bawaan PDF (Helvetica) hanya mendukung karakter WinAnsi/Latin.
 * Satu karakter di luar itu (emoji, huruf Arab, spasi tak terlihat, dll.)
 * membuat pdf-lib melempar error dan seluruh laporan gagal diunduh.
 *
 * Aturan: karakter yang SUDAH didukung font tidak pernah diubah.
 * Hanya karakter yang tidak didukung yang dipetakan, dibuang, atau diganti "?".
 */
const FALLBACKS: Array<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u2032]/u, "'"],
  [/[\u201C\u201D\u201E\u2033]/u, '"'],
  [/[\u2010\u2011\u2012\u2015\u2212]/u, "-"],
  [/[\u2000-\u200A\u202F\u205F\u3000]/u, " "],
];

// Karakter tak terlihat / penyusun emoji: dibuang tanpa pengganti.
const DROPPED =
  /[\u00AD\u200B-\u200F\u202A-\u202E\u2060\uFE00-\uFE0F\uFEFF\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}]|\p{Extended_Pictographic}/u;

export function sanitizeForFont(text: unknown, font: PDFFont) {
  const supported = new Set<number>(font.getCharacterSet());
  let out = "";

  for (const ch of Array.from(String(text ?? ""))) {
    const codePoint = ch.codePointAt(0) as number;

    if (supported.has(codePoint)) {
      out += ch;
      continue;
    }

    if (codePoint === 9 || codePoint === 10 || codePoint === 13) {
      out += " ";
      continue;
    }

    if (DROPPED.test(ch)) continue;

    const fallback = FALLBACKS.find(([pattern]) => pattern.test(ch));
    if (fallback) {
      out += fallback[1];
      continue;
    }

    const base = ch.normalize("NFKD").replace(/[\u0300-\u036F]/g, "");
    if (
      base &&
      Array.from(base).every((c) => supported.has(c.codePointAt(0) as number))
    ) {
      out += base;
      continue;
    }

    out += "?";
  }

  return out.replace(/\?{2,}/g, "?");
}