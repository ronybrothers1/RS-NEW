import ArticleForm from "../../components/ArticleForm";
import { sanitizeArticleHtml } from "@/lib/article-content";
import { db } from "@/src/db";
import {
  articles,
  programs,
} from "@/src/db/schema";
import {
  asc,
  eq,
} from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditBeritaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    articleRows,
    allPrograms,
  ] = await Promise.all([
    db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1),
    db
      .select({
        id: programs.id,
        name: programs.name,
        status: programs.status,
      })
      .from(programs)
      .orderBy(asc(programs.name)),
  ]);

  const [article] = articleRows;

  if (!article) {
    notFound();
  }

  return (
    <ArticleForm
      programs={allPrograms}
      article={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        programId: article.programId,
        content: sanitizeArticleHtml(article.content),
        excerpt: article.excerpt,
        imageUrl: article.imageUrl,
        imageAlt: article.imageAlt,
        imageCaption: article.imageCaption,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        status: article.status,
        scheduledAt:
          article.scheduledAt?.toISOString() ??
          null,
      }}
    />
  );
}
