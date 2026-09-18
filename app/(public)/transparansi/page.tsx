import type {
  Metadata,
} from "next";

import {
  createPageMetadata,
} from "@/lib/seo-metadata";

import TransparencyPageContent from "./TransparencyPageContent";

export const revalidate =
  300;

export const metadata: Metadata =
  createPageMetadata({
    title:
      "Transparansi Keuangan",
    description:
      "Pantau penerimaan, pengeluaran, saldo kas, dan riwayat transaksi Yayasan Ruang Sejahtera yang dipublikasikan secara terbuka dan terukur.",
    path:
      "/transparansi",
  });

export default function TransparansiPage() {
  return (
    <TransparencyPageContent />
  );
}