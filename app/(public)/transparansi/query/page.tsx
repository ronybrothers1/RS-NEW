import type {
  Metadata,
} from "next";

import {
  createPageMetadata,
} from "@/lib/seo-metadata";

import TransparencyPageContent from "../TransparencyPageContent";

export const dynamic =
  "force-dynamic";

const publicMetadata =
  createPageMetadata({
    title:
      "Transparansi Keuangan",
    description:
      "Pantau penerimaan, pengeluaran, saldo kas, dan riwayat transaksi Yayasan Ruang Sejahtera yang dipublikasikan secara terbuka dan terukur.",
    path:
      "/transparansi",
  });

export const metadata: Metadata = {
  ...publicMetadata,
  robots: {
    index: false,
    follow: true,
  },
};

type TransparencySearchParams = {
  q?: string | string[];
  page?: string | string[];
};

export default async function TransparansiQueryPage({
  searchParams,
}: {
  searchParams:
    Promise<TransparencySearchParams>;
}) {
  const params =
    await searchParams;

  return (
    <TransparencyPageContent
      q={params.q}
      page={params.page}
    />
  );
}