import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";

import { buildFinanceReportPdf } from "../lib/finance-report-pdf";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
  console.log(`[PASS] ${message}`);
}

async function main() {
  const files = [
    "app/(public)/page.tsx",
    "app/(public)/kontak/page.tsx",
    "app/(public)/tentang-kami/page.tsx",
    "app/(public)/bantuan/page.tsx",
    "app/(public)/transparansi/page.tsx",
    "app/admin/components/AdminSidebar.tsx",
  ];

  const source = files
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  for (const forbidden of [
    "Mabecce?",
    "REHAT (Renovasi Rumah Rakyat)",
    "prinsip-prinsiring",
    "Formulir kosong yang sebelumnya tidak",
    "15 transaksi terakhir",
  ]) {
    assert(!source.includes(forbidden), `Tidak ada string lama: ${forbidden}`);
  }

  assert(
    source.includes("Cara Mengajukan Bantuan"),
    "Petunjuk pengajuan tersedia di Bantu Mereka",
  );
  assert(
    source.includes("Riwayat Transaksi Bulan Ini"),
    "Transparansi memakai riwayat bulan berjalan",
  );
  assert(
    readFileSync("app/(public)/page.tsx", "utf8").includes(
      "pt-14 pb-24 md:pt-20 md:pb-32",
    ),
    "Spacing hero sudah dipadatkan",
  );
  assert(
    readFileSync("app/admin/components/AdminSidebar.tsx", "utf8").includes(
      "/admin/keuangan/laporan",
    ),
    "Menu Laporan Keuangan tersedia",
  );

  const sampleRows = Array.from({ length: 90 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 8, (index % 30) + 1, 12)),
    type: index % 3 === 0 ? ("OUT" as const) : ("IN" as const),
    description: `Transaksi uji ${index + 1} dengan keterangan yang cukup panjang untuk menguji pembungkus baris tabel PDF.`,
    programName: index % 2 === 0 ? "Berbagi Rasa" : null,
    amount: 10000 + index * 1000,
  }));

  const bytes = await buildFinanceReportPdf({
    periodLabel: "September 2026",
    generatedAt: new Date(),
    openingBalance: 5920033,
    totalIn: 10000000,
    totalOut: 3000000,
    closingBalance: 12920033,
    rows: sampleRows,
  });

  assert(bytes.length > 1000, "PDF laporan menghasilkan byte yang wajar");
  const loaded = await PDFDocument.load(bytes);
  assert(loaded.getPageCount() >= 2, "PDF multi-halaman bekerja");
}

main().catch((error) => {
  console.error("QA Batch 1 gagal:", error);
  process.exitCode = 1;
});
