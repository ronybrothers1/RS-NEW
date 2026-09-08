// Rendered on-demand because this page reads directly from the database.
export const dynamic = "force-dynamic";

import { db } from "@/src/db";
import { articles, users } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { sanitizeArticleHtml } from "@/lib/article-content";
import { publishDueArticles } from "@/lib/article-publication";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: Props,
): Promise<Metadata> {
  const { slug } = await props.params;

  await publishDueArticles();

  const [article] = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.slug, slug),
        eq(articles.status, "PUBLISHED"),
      ),
    )
    .limit(1);

  if (!article) {
    return {
      title: "Berita Tidak Ditemukan",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: article.metaTitle || article.title,
    description:
      article.metaDescription || article.excerpt || "",
    openGraph: {
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  };
}

export default async function BeritaDetailPage(props: Props) {
  const { slug } = await props.params;

  await publishDueArticles();

  const [articleData] = await db
    .select({
      article: articles,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(
      and(
        eq(articles.slug, slug),
        eq(articles.status, "PUBLISHED"),
      ),
    )
    .limit(1);

  if (!articleData) {
    notFound();
  }

  const { article, authorName } = articleData;

  return (
    <div className="min-h-screen bg-white">
      <main className="py-8 sm:py-12 md:py-20">
        <article className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/berita"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Kembali ke Indeks Berita
          </Link>

          <h1 className="mb-6 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
            {article.title}
          </h1>

          <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-100 pb-8 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-slate-700">
                {authorName ?? "Admin Yayasan"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                {new Date(
                  article.publishedAt ?? article.createdAt,
                ).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {article.imageUrl && (
            <figure className="mb-10 overflow-hidden rounded-2xl bg-slate-100">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.imageAlt || article.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {article.imageCaption && (
                <figcaption className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm leading-6 text-slate-600 sm:px-6">
                  {article.imageCaption}
                </figcaption>
              )}
            </figure>
          )}

          {article.excerpt && (
            <p className="mb-8 border-l-4 border-teal-600 pl-4 text-lg leading-8 text-slate-600">
              {article.excerpt}
            </p>
          )}

          <div
            className="
              prose prose-slate max-w-none
              sm:prose-lg
              prose-headings:font-bold
              prose-headings:leading-tight
              prose-p:leading-8
              prose-li:leading-8
              prose-a:text-teal-600
              prose-a:break-words
              prose-img:h-auto
              prose-img:max-w-full
              prose-img:rounded-xl
              [&_.ql-align-center]:text-center
              [&_.ql-align-right]:text-right
              [&_.ql-align-justify]:text-justify
              [&_iframe]:aspect-video
              [&_iframe]:h-auto
              [&_iframe]:w-full
              [&_iframe]:max-w-full
              [&_iframe]:rounded-xl
              [&_iframe]:border-0
            "
            dangerouslySetInnerHTML={{
              __html: sanitizeArticleHtml(article.content),
            }}
          />
        </article>
      </main>
    </div>
  );
}
