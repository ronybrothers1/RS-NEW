import {
  unstable_cache,
} from "next/cache";
import {
  and,
  desc,
  eq,
  sql,
} from "drizzle-orm";

import {
  db,
} from "@/src/db";
import {
  articles,
  programs,
  users,
} from "@/src/db/schema";

export const PUBLIC_ARTICLES_CACHE_TAG =
  "public-articles";

const PUBLIC_ARTICLES_REVALIDATE_SECONDS =
  300;

type LatestPublishedArticle = {
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  publishedAt: string | null;
  createdAt: string;
};

type PublicArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  programName: string | null;
  createdAt: string;
  publishedAt: string | null;
  authorName: string | null;
};

type PublishedArticle = {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageCaption: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

type CachedPublishedArticle = {
  article: {
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    imageCaption: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
  };
  authorName: string | null;
};

type PreviousPublishedArticle = {
  title: string;
  slug: string;
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
        PUBLIC_ARTICLES_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ARTICLES_CACHE_TAG,
      ],
    },
  );

async function loadPublishedArticles(): Promise<
  PublicArticleListItem[]
> {
  const publishedArticles =
    await db
      .select({
        id:
          articles.id,
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
        programName:
          programs.name,
        createdAt:
          articles.createdAt,
        publishedAt:
          articles.publishedAt,
        authorName:
          users.name,
      })
      .from(
        articles,
      )
      .leftJoin(
        users,
        eq(
          articles.authorId,
          users.id,
        ),
      )
      .leftJoin(
        programs,
        eq(
          articles.programId,
          programs.id,
        ),
      )
      .where(
        eq(
          articles.status,
          "PUBLISHED",
        ),
      )
      .orderBy(
        desc(
          sql`COALESCE(${articles.publishedAt}, ${articles.createdAt})`,
        ),
      );

  return publishedArticles.map(
    (article) => ({
      ...article,
      createdAt:
        article.createdAt.toISOString(),
      publishedAt:
        article.publishedAt?.toISOString() ??
        null,
    }),
  );
}

export const getCachedPublishedArticles =
  unstable_cache(
    loadPublishedArticles,
    [
      "public-published-articles-v2",
    ],
    {
      revalidate:
        PUBLIC_ARTICLES_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ARTICLES_CACHE_TAG,
      ],
    },
  );

async function loadPublishedArticle(
  slug: string,
): Promise<CachedPublishedArticle | null> {
  const [
    articleData,
  ] =
    await db
      .select({
        title:
          articles.title,
        slug:
          articles.slug,
        content:
          articles.content,
        excerpt:
          articles.excerpt,
        imageUrl:
          articles.imageUrl,
        imageAlt:
          articles.imageAlt,
        imageCaption:
          articles.imageCaption,
        metaTitle:
          articles.metaTitle,
        metaDescription:
          articles.metaDescription,
        createdAt:
          articles.createdAt,
        updatedAt:
          articles.updatedAt,
        publishedAt:
          articles.publishedAt,
        authorName:
          users.name,
      })
      .from(
        articles,
      )
      .leftJoin(
        users,
        eq(
          articles.authorId,
          users.id,
        ),
      )
      .where(
        and(
          eq(
            articles.slug,
            slug,
          ),
          eq(
            articles.status,
            "PUBLISHED",
          ),
        ),
      )
      .limit(1);

  if (!articleData) {
    return null;
  }

  return {
    article: {
      title:
        articleData.title,
      slug:
        articleData.slug,
      content:
        articleData.content,
      excerpt:
        articleData.excerpt,
      imageUrl:
        articleData.imageUrl,
      imageAlt:
        articleData.imageAlt,
      imageCaption:
        articleData.imageCaption,
      metaTitle:
        articleData.metaTitle,
      metaDescription:
        articleData.metaDescription,
      createdAt:
        articleData.createdAt.toISOString(),
      updatedAt:
        articleData.updatedAt.toISOString(),
      publishedAt:
        articleData.publishedAt?.toISOString() ??
        null,
    },
    authorName:
      articleData.authorName,
  };
}

const getCachedPublishedArticleData =
  unstable_cache(
    loadPublishedArticle,
    [
      "public-published-article-v1",
    ],
    {
      revalidate:
        PUBLIC_ARTICLES_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ARTICLES_CACHE_TAG,
      ],
    },
  );

export async function getCachedPublishedArticle(
  slug: string,
): Promise<{
  article: PublishedArticle;
  authorName: string | null;
} | null> {
  const articleData =
    await getCachedPublishedArticleData(
      slug,
    );

  if (!articleData) {
    return null;
  }

  return {
    article: {
      ...articleData.article,
      createdAt:
        new Date(
          articleData.article.createdAt,
        ),
      updatedAt:
        new Date(
          articleData.article.updatedAt,
        ),
      publishedAt:
        articleData.article.publishedAt
          ? new Date(
              articleData.article.publishedAt,
            )
          : null,
    },
    authorName:
      articleData.authorName,
  };
}

async function loadPreviousPublishedArticle(
  currentArticleDateIso: string,
  articleCreatedAtIso: string,
): Promise<PreviousPublishedArticle | null> {
  const currentArticleDate =
    new Date(
      currentArticleDateIso,
    );

  const articleCreatedAt =
    new Date(
      articleCreatedAtIso,
    );

  const [
    previousArticle,
  ] =
    await db
      .select({
        title:
          articles.title,
        slug:
          articles.slug,
      })
      .from(
        articles,
      )
      .where(
        and(
          eq(
            articles.status,
            "PUBLISHED",
          ),
          sql`(
            COALESCE(${articles.publishedAt}, ${articles.createdAt}) < ${currentArticleDate}
            OR (
              COALESCE(${articles.publishedAt}, ${articles.createdAt}) = ${currentArticleDate}
              AND ${articles.createdAt} < ${articleCreatedAt}
            )
          )`,
        ),
      )
      .orderBy(
        sql`COALESCE(${articles.publishedAt}, ${articles.createdAt}) DESC`,
        sql`${articles.createdAt} DESC`,
      )
      .limit(1);

  return previousArticle ?? null;
}

const getCachedPreviousPublishedArticleData =
  unstable_cache(
    loadPreviousPublishedArticle,
    [
      "public-previous-published-article-v1",
    ],
    {
      revalidate:
        PUBLIC_ARTICLES_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ARTICLES_CACHE_TAG,
      ],
    },
  );

export async function getCachedPreviousPublishedArticle(
  currentArticleDate: Date,
  articleCreatedAt: Date,
) {
  return getCachedPreviousPublishedArticleData(
    currentArticleDate.toISOString(),
    articleCreatedAt.toISOString(),
  );
}