// Rendered on-demand instead of prerendered at build time: this page
// queries the database, which is not reachable from the build machine.
export const dynamic = 'force-dynamic';
import { db } from "@/src/db";
import { articles, users } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ArrowLeft, User, Calendar } from "lucide-react";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import sanitizeHtml from 'sanitize-html';
import { publishDueArticles } from "@/lib/article-publication";

type Props = {
  params: Promise<{ slug: string }>
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  await publishDueArticles();
  const [article] = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.slug, params.slug),
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
    description: article.metaDescription || article.excerpt || '',
    openGraph: {
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  };
}

export default async function BeritaDetailPage(props: Props) {
  const params = await props.params;
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
        eq(articles.slug, params.slug),
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
      
      
      <main className="py-12 md:py-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/berita" className="inline-flex items-center gap-2 text-teal-700 font-medium hover:text-teal-800 transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Indeks Berita
          </Link>

          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 mb-10 pb-10 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-slate-700">{authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{new Date(article.publishedAt ?? article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {article.imageUrl && (
            <div className="mb-12 rounded-2xl overflow-hidden bg-slate-100">
              <img 
                src={article.imageUrl} 
                alt={article.imageAlt || article.title}
                className="w-full h-auto object-cover max-h-[500px]"
              />
              {article.imageAlt && (
                <div className="text-center text-sm text-slate-500 py-3 bg-slate-50">
                  {article.imageAlt}
                </div>
              )}
            </div>
          )}

          {/* Render HTML content safely styled */}
          <div 
            className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-a:text-teal-600 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content, { allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]) }) }}
          />
        </article>
      </main>
    </div>
  );
}
