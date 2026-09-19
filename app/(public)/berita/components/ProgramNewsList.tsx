"use client";

import {
  ArrowRight,
  Image as ImageIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  articleMatchesProgram,
  getProgramNewsLabel,
  isProgramNewsKey,
  type ProgramNewsKey,
} from "@/lib/program-news";

type PublicArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt:
    | string
    | null;
  imageUrl:
    | string
    | null;
  imageAlt:
    | string
    | null;
  createdAt: string;
  publishedAt:
    | string
    | null;
  authorName:
    | string
    | null;
};

function readProgramFromLocation():
  ProgramNewsKey | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const value =
    new URLSearchParams(
      window.location.search,
    ).get("program");

  return value &&
    isProgramNewsKey(
      value,
    )
    ? value
    : null;
}

export default function ProgramNewsList({
  articles,
}: {
  articles:
    PublicArticleListItem[];
}) {
  const [
    activeProgram,
    setActiveProgram,
  ] =
    useState<
      ProgramNewsKey | null
    >(null);

  useEffect(() => {
    const syncProgram =
      () => {
        setActiveProgram(
          readProgramFromLocation(),
        );
      };

    syncProgram();

    window.addEventListener(
      "popstate",
      syncProgram,
    );

    return () => {
      window.removeEventListener(
        "popstate",
        syncProgram,
      );
    };
  }, []);

  const filteredArticles =
    useMemo(
      () =>
        activeProgram
          ? articles.filter(
              (article) =>
                articleMatchesProgram(
                  article,
                  activeProgram,
                ),
            )
          : articles,
      [
        activeProgram,
        articles,
      ],
    );

  const activeLabel =
    activeProgram
      ? getProgramNewsLabel(
          activeProgram,
        )
      : null;

  if (
    articles.length === 0
  ) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
        <h3 className="mb-2 text-xl font-medium text-slate-900">
          Belum ada berita
        </h3>
        <p className="text-slate-500">
          Artikel dan berita terbaru akan segera hadir.
        </p>
      </div>
    );
  }

  return (
    <>
      {activeLabel && (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-teal-100 bg-teal-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
              Filter Program
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
              Berita terkait{" "}
              {activeLabel}
            </p>
          </div>

          <a
            href="/berita"
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 sm:self-auto"
          >
            <X className="h-4 w-4" />
            Lihat Semua Berita
          </a>
        </div>
      )}

      {filteredArticles.length ===
      0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="text-xl font-semibold text-slate-900">
            Belum ada berita
            untuk program ini
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Belum ada artikel
            yang teridentifikasi
            relevan dengan{" "}
            {activeLabel}.
          </p>

          <a
            href="/berita"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Lihat Semua Berita
          </a>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map(
            (art) => (
              <article
                key={art.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <Link
                  href={`/berita/${art.slug}`}
                  className="relative block aspect-video overflow-hidden bg-slate-100"
                >
                  {art.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- stored runtime news media URL is rendered directly for compatibility */
                    <img
                      src={
                        art.imageUrl
                      }
                      alt={
                        art.imageAlt ||
                        art.title
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>
                      {new Date(
                        art.publishedAt ??
                          art.createdAt,
                      ).toLocaleDateString(
                        "id-ID",
                        {
                          day:
                            "numeric",
                          month:
                            "long",
                          year:
                            "numeric",
                        },
                      )}
                    </span>

                    <span>
                      {
                        art.authorName
                      }
                    </span>
                  </div>

                  <h3 className="mb-3 line-clamp-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-teal-700">
                    <Link
                      href={`/berita/${art.slug}`}
                    >
                      {
                        art.title
                      }
                    </Link>
                  </h3>

                  <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                    {art.excerpt ||
                      "Baca artikel selengkapnya dengan menekan tombol di bawah ini."}
                  </p>

                  <Link
                    href={`/berita/${art.slug}`}
                    className="mt-auto flex items-center gap-1 border-t border-slate-100 pt-4 text-sm font-medium text-teal-700 transition-all group-hover:gap-2"
                  >
                    Baca Artikel
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </>
  );
}