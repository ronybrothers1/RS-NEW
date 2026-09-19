export const revalidate = 300;

import {
  createPageMetadata,
} from "@/lib/seo-metadata";
import {
  getCachedPublishedArticles,
} from "@/lib/public-articles";

import ProgramNewsList from "./components/ProgramNewsList";

export const metadata =
  createPageMetadata({
    title:
      "Berita dan Artikel",
    description:
      "Berita dan artikel terbaru Yayasan Ruang Sejahtera tentang kegiatan sosial, penyaluran bantuan, dan kepedulian masyarakat di Kabupaten Sampang.",
    path: "/berita",
  });

export default async function PublicBeritaPage() {
  const allArticles =
    await getCachedPublishedArticles();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden bg-slate-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-bold text-white md:text-5xl">
            Berita &amp; Artikel
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
            Kisah inspiratif, update program, dan literasi kebaikan dari Yayasan Ruang Sejahtera.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ProgramNewsList
          articles={
            allArticles
          }
        />
      </div>
    </div>
  );
}