import { db } from "@/src/db";
import { articles, users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Eye, User } from "lucide-react";
import { sanitizeArticleHtml } from "@/lib/article-content";

export const dynamic = "force-dynamic";

export default async function PreviewBeritaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [articleData] = await db
    .select({
      article: articles,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.id, id))
    .limit(1);

  if (!articleData) {
    notFound();
  }

  const { article, authorName } = articleData;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/admin/berita/${article.id}/edit`}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Kembali ke Editor
        </Link>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          <Eye className="h-4 w-4 shrink-0" />
          MODE PRATINJAU
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="mx-auto max-w-3xl px-4 pb-7 pt-6 sm:px-6 md:pt-10">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl md:text-4xl">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-slate-100 pb-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              {authorName ?? "Admin Yayasan"}
            </span>

            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              {new Date(
                article.publishedAt ?? article.createdAt,
              ).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {article.status}
            </span>
          </div>
        </header>

        {article.imageUrl && (
          <figure className="mx-auto mb-8 w-full max-w-4xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.imageAlt || article.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {article.imageCaption ? (
                <figcaption className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm leading-6 text-slate-600 sm:px-6">
                  {article.imageCaption}
                </figcaption>
              ) : (
                <figcaption className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-center text-xs leading-5 text-amber-700">
                  Caption gambar belum diisi. Isi melalui Editor Berita.
                </figcaption>
              )}
            </div>
          </figure>
        )}

        <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6 md:pb-14">
          {article.excerpt && (
            <p className="mb-8 border-l-4 border-teal-600 pl-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
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
        </div>
      </article>
    </div>
  );
}
