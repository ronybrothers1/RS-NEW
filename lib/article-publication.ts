import { db } from "@/src/db";
import { articles, auditLogs } from "@/src/db/schema";
import { and, eq, lte } from "drizzle-orm";

export async function publishDueArticles() {
  const now = new Date();

  try {
    return await db.transaction(async (tx) => {
      const dueArticles = await tx
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.status, "SCHEDULED"),
            lte(articles.scheduledAt, now),
          ),
        );

      let publishedCount = 0;

      for (const oldArticle of dueArticles) {
        const [publishedArticle] = await tx
          .update(articles)
          .set({
            status: "PUBLISHED",
            publishedAt: oldArticle.scheduledAt ?? now,
            scheduledAt: null,
            archivedAt: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(articles.id, oldArticle.id),
              eq(articles.status, "SCHEDULED"),
              lte(articles.scheduledAt, now),
            ),
          )
          .returning();

        if (!publishedArticle) {
          continue;
        }

        await tx.insert(auditLogs).values({
          userId: oldArticle.authorId,
          action: "AUTO_PUBLISH",
          tableName: "articles",
          recordId: oldArticle.id,
          oldData: oldArticle,
          newData: publishedArticle,
        });

        publishedCount += 1;
      }

      return publishedCount;
    });
  } catch (error) {
    console.error("publishDueArticles: failed", error);
    return 0;
  }
}
