import {
  unstable_cache,
} from "next/cache";
import {
  eq,
  sql,
} from "drizzle-orm";

import {
  db,
} from "@/src/db";
import {
  articles,
} from "@/src/db/schema";

export const PUBLIC_ARTICLES_CACHE_TAG =
  "public-articles";

type LatestPublishedArticle = {
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  publishedAt: string | null;
  createdAt: string;
};

async function loadLatestPublishedArticle(): Promise<
  LatestPublishedArticle | null
> {
  const [
    latestArticle,
  ] =
    await db
      .select({
        title:
          articles.title,
        slug:
          articles.slug,
        excerpt:
          articles.excerpt,
        imageUrl:
          articles.imageUrl,
        imageAlt:
          articles.imageAlt,
        publishedAt:
          articles.publishedAt,
        createdAt:
          articles.createdAt,
      })
      .from(
        articles,
      )
      .where(
        eq(
          articles.status,
          "PUBLISHED",
        ),
      )
      .orderBy(
        sql`${articles.publishedAt} DESC NULLS LAST, ${articles.createdAt} DESC`,
      )
      .limit(1);

  if (!latestArticle) {
    return null;
  }

  return {
    ...latestArticle,
    publishedAt:
      latestArticle.publishedAt?.toISOString() ??
      null,
    createdAt:
      latestArticle.createdAt.toISOString(),
  };
}

export const getCachedLatestPublishedArticle =
  unstable_cache(
    loadLatestPublishedArticle,
    [
      "public-latest-published-article-v2",
    ],
    {
      revalidate:
        300,
      tags: [
        PUBLIC_ARTICLES_CACHE_TAG,
      ],
    },
  );