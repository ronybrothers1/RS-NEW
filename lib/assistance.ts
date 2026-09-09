export type AssistanceApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "NEEDS_REVISION"
  | "APPROVED"
  | "REJECTED";

export const ASSISTANCE_STATUS_META: Record<
  AssistanceApplicationStatus,
  {
    label: string;
    className: string;
    description: string;
  }
> = {
  DRAFT: {
    label: "Draf",
    className:
      "border-slate-200 bg-slate-50 text-slate-700",
    description:
      "Pengajuan tersimpan dan belum dikirim untuk diverifikasi.",
  },
  SUBMITTED: {
    label: "Menunggu Verifikasi",
    className:
      "border-amber-200 bg-amber-50 text-amber-800",
    description:
      "Pengajuan sudah dikirim dan sedang menunggu pemeriksaan pengurus.",
  },
  NEEDS_REVISION: {
    label: "Perlu Diperbaiki",
    className:
      "border-orange-200 bg-orange-50 text-orange-800",
    description:
      "Pengurus meminta perbaikan atau tambahan data sebelum pengajuan diperiksa kembali.",
  },
  APPROVED: {
    label: "Disetujui",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    description:
      "Pengajuan telah disetujui oleh pengurus.",
  },
  REJECTED: {
    label: "Tidak Disetujui",
    className:
      "border-rose-200 bg-rose-50 text-rose-800",
    description:
      "Pengajuan tidak dapat dilanjutkan berdasarkan hasil verifikasi.",
  },
};

export type AssistanceQuestion = {
  key: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "select";
  placeholder?: string;
  options?: string[];
};

type ProgramKey =
  | "berbagi_rasa"
  | "rehat"
  | "air_bersih"
  | "masa_depan"
  | "kesehatan"
  | "merakyat";

export function getProgramKey(
  programName: string,
): ProgramKey {
  const value =
    programName
      .toLowerCase()
      .trim();

  if (
    value.includes("rehat") ||
    value.includes("renovasi rumah")
  ) {
    return "rehat";
  }

  if (
    value.includes("air bersih")
  ) {
    return "air_bersih";
  }

  if (
    value.includes("masa depan") ||
    value.includes("pendidikan")
  ) {
    return "masa_depan";
  }

  if (
    value.includes("kesehatan")
  ) {
    return "kesehatan";
  }

  if (
    value.includes("merakyat") ||
    value.includes("usaha")
  ) {
    return "merakyat";
  }

  return "berbagi_rasa";
}

const PROGRAM_QUESTIONS: Record<
  ProgramKey,
  AssistanceQuestion[]
> = {
  berbagi_rasa: [
    {
      key:
        "mainNeed",
      label:
        "Kebutuhan utama keluarga",
      type:
        "textarea",
      placeholder:
        "Jelaskan kebutuhan pokok yang paling mendesak.",
    },
    {
      key:
        "economicCondition",
      label:
        "Kondisi ekonomi keluarga",
      type:
        "textarea",
      placeholder:
        "Jelaskan sumber penghasilan dan kondisi ekonomi secara singkat.",
    },
    {
      key:
        "familyMembers",
      label:
        "Jumlah anggota keluarga yang ditanggung",
      type:
        "number",
      placeholder:
        "Contoh: 4",
    },
  ],

  rehat: [
    {
      key:
        "houseOwnership",
      label:
        "Status tempat tinggal",
      type:
        "select",
      options: [
        "Milik sendiri",
        "Milik keluarga",
        "Menumpang",
        "Sewa",
        "Lainnya",
      ],
    },
    {
      key:
        "damagedParts",
      label:
        "Bagian rumah yang paling membutuhkan perbaikan",
      type:
        "textarea",
      placeholder:
        "Contoh: dinding, lantai, atap, kamar mandi, atau bagian lain.",
    },
    {
      key:
        "householdMembers",
      label:
        "Jumlah penghuni rumah",
      type:
        "number",
      placeholder:
        "Contoh: 5",
    },
  ],

  air_bersih: [
    {
      key:
        "currentWaterSource",
      label:
        "Sumber air yang digunakan saat ini",
      type:
        "text",
      placeholder:
        "Contoh: sumur, sungai, membeli air, atau sumber lain.",
    },
    {
      key:
        "waterProblem",
      label:
        "Masalah ketersediaan air bersih",
      type:
        "textarea",
      placeholder:
        "Jelaskan kondisi kekeringan atau kesulitan memperoleh air.",
    },
    {
      key:
        "affectedPeople",
      label:
        "Perkiraan jumlah warga/anggota keluarga yang terdampak",
      type:
        "number",
      placeholder:
        "Contoh: 25",
    },
  ],

  masa_depan: [
    {
      key:
        "educationLevel",
      label:
        "Jenjang pendidikan",
      type:
        "select",
      options: [
        "SD/MI",
        "SMP/MTs",
        "SMA/SMK/MA",
        "Perguruan Tinggi",
        "Lainnya",
      ],
    },
    {
      key:
        "schoolName",
      label:
        "Nama sekolah/lembaga pendidikan",
      type:
        "text",
      placeholder:
        "Tuliskan nama sekolah atau lembaga pendidikan.",
    },
    {
      key:
        "educationNeed",
      label:
        "Bantuan pendidikan yang dibutuhkan",
      type:
        "textarea",
      placeholder:
        "Contoh: seragam, perlengkapan sekolah, biaya pendidikan, atau kebutuhan lain.",
    },
  ],

  kesehatan: [
    {
      key:
        "healthCondition",
      label:
        "Kondisi kesehatan yang sedang dihadapi",
      type:
        "textarea",
      placeholder:
        "Jelaskan kondisi dan kebutuhan bantuan secara ringkas.",
    },
    {
      key:
        "healthFacility",
      label:
        "Fasilitas kesehatan yang pernah/ sedang menangani",
      type:
        "text",
      placeholder:
        "Contoh: puskesmas, klinik, rumah sakit, atau belum pernah diperiksa.",
    },
    {
      key:
        "healthNeed",
      label:
        "Bentuk bantuan yang dibutuhkan",
      type:
        "textarea",
      placeholder:
        "Contoh: biaya pemeriksaan, obat, transportasi, alat kesehatan, atau kebutuhan lain.",
    },
  ],

  merakyat: [
    {
      key:
        "businessType",
      label:
        "Jenis usaha",
      type:
        "text",
      placeholder:
        "Contoh: warung, pedagang keliling, produksi rumahan, atau usaha lain.",
    },
    {
      key:
        "businessDuration",
      label:
        "Lama usaha berjalan",
      type:
        "text",
      placeholder:
        "Contoh: 2 tahun.",
    },
    {
      key:
        "businessNeed",
      label:
        "Bantuan usaha yang dibutuhkan",
      type:
        "textarea",
      placeholder:
        "Jelaskan kebutuhan renovasi, peralatan, bahan, atau modal usaha.",
    },
  ],
};

export function getProgramQuestions(
  programName: string,
) {
  return PROGRAM_QUESTIONS[
    getProgramKey(
      programName,
    )
  ];
}

export function formatRupiah(
  amount:
    | string
    | number
    | null
    | undefined,
) {
  const value =
    typeof amount ===
    "number"
      ? amount
      : Number(
          amount || 0,
        );

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(
    Number.isFinite(value)
      ? value
      : 0,
  );
}
