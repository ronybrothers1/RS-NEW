import ArticleForm from "../../components/ArticleForm";
import { db } from "@/src/db";
import { articles } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditBeritaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  if (!article) {
    notFound();
  }

  return (
    <ArticleForm
      article={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        imageUrl: article.imageUrl,
        imageAlt: article.imageAlt,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        status: article.status,
        scheduledAt: article.scheduledAt?.toISOString() ?? null,
      }}
    />
  );
}
