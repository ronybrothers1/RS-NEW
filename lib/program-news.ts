export const PROGRAM_NEWS_CONFIG = {
  "berbagi-rasa": {
    label: "Berbagi Rasa",
    programAliases: [
      "berbagi rasa",
    ],
    articleTerms: [
      "berbagi rasa",
      "sembako",
      "bantuan beras",
      "beras",
      "bantuan pangan",
      "pangan",
      "kebutuhan pokok",
      "jumat berkah",
    ],
  },
  "berbagi-air-bersih": {
    label: "Berbagi Air Bersih",
    programAliases: [
      "berbagi air bersih",
      "air bersih",
    ],
    articleTerms: [
      "berbagi air bersih",
      "air bersih",
      "tangki air",
      "kemarau",
      "kekeringan",
    ],
  },
  "berbagi-masa-depan": {
    label: "Berbagi Masa Depan",
    programAliases: [
      "berbagi masa depan",
    ],
    articleTerms: [
      "berbagi masa depan",
      "pendidikan",
      "sekolah",
      "pelajar",
      "siswa",
      "santri",
      "beasiswa",
      "belajar",
    ],
  },
  "bantuan-kesehatan": {
    label: "Bantuan Kesehatan",
    programAliases: [
      "bantuan kesehatan",
      "kesehatan",
    ],
    articleTerms: [
      "bantuan kesehatan",
      "kesehatan",
      "berobat",
      "pengobatan",
      "medis",
      "rumah sakit",
      "pasien",
    ],
  },
  rehat: {
    label: "REHAT (Renovasi Hunian Rakyat)",
    programAliases: [
      "rehat",
      "renovasi hunian rakyat",
    ],
    articleTerms: [
      "rehat",
      "renovasi hunian rakyat",
      "bedah rumah",
      "renovasi rumah",
      "perbaikan rumah",
      "rumah layak",
      "hunian",
    ],
  },
  merakyat: {
    label: "Merakyat (Mabecce Usahanah Rakyat)",
    programAliases: [
      "merakyat",
      "mabecce usahanah rakyat",
    ],
    articleTerms: [
      "merakyat",
      "mabecce usahanah rakyat",
      "modal usaha",
      "usaha mikro",
      "usaha kecil",
      "umkm",
    ],
  },
} as const;

export type ProgramNewsKey =
  keyof typeof PROGRAM_NEWS_CONFIG;

function normalizeText(
  value: string,
) {
  return value
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}

export function isProgramNewsKey(
  value: string,
): value is ProgramNewsKey {
  return Object.prototype.hasOwnProperty.call(
    PROGRAM_NEWS_CONFIG,
    value,
  );
}

export function getProgramNewsKey(
  programName: string,
): ProgramNewsKey | null {
  const normalized =
    normalizeText(
      programName,
    );

  for (
    const [
      key,
      config,
    ] of Object.entries(
      PROGRAM_NEWS_CONFIG,
    ) as [
      ProgramNewsKey,
      (typeof PROGRAM_NEWS_CONFIG)[ProgramNewsKey],
    ][]
  ) {
    if (
      config.programAliases.some(
        (alias) =>
          normalized.includes(
            normalizeText(
              alias,
            ),
          ),
      )
    ) {
      return key;
    }
  }

  return null;
}

export function getProgramNewsHref(
  programName: string,
) {
  const key =
    getProgramNewsKey(
      programName,
    );

  return key
    ? `/berita?program=${key}`
    : "/berita";
}

export function getProgramNewsLabel(
  key: ProgramNewsKey,
) {
  return PROGRAM_NEWS_CONFIG[
    key
  ].label;
}

export function articleMatchesProgram(
  article: {
    title: string;
    slug: string;
    excerpt:
      | string
      | null;
  },
  key: ProgramNewsKey,
) {
  const haystack =
    normalizeText(
      [
        article.title,
        article.slug.replace(
          /-/g,
          " ",
        ),
        article.excerpt || "",
      ].join(" "),
    );

  return PROGRAM_NEWS_CONFIG[
    key
  ].articleTerms.some(
    (term) =>
      haystack.includes(
        normalizeText(
          term,
        ),
      ),
  );
}