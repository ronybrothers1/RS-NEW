import { MetadataRoute } from 'next';
import { db } from "@/src/db";
import { articles, activities } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { publishDueArticles } from "@/lib/article-publication";

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  await publishDueArticles();

  let articleUrls: MetadataRoute.Sitemap = [];
  let activityUrls: MetadataRoute.Sitemap = [];

  try {
    const publishedArticles = await db
      .select({
        slug: articles.slug,
        createdAt: articles.createdAt,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(eq(articles.status, 'PUBLISHED'));

    articleUrls = publishedArticles.map((article) => ({
      url: `${baseUrl}/berita/${article.slug}`,
      lastModified: article.updatedAt ?? article.publishedAt ?? article.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('sitemap: failed to fetch published articles', error);
  }

  try {
    const publishedActivities = await db
      .select({ slug: activities.slug, createdAt: activities.createdAt })
      .from(activities)
      .where(eq(activities.isPublished, true));

    activityUrls = publishedActivities.map((activity) => ({
      url: `${baseUrl}/kegiatan/${activity.slug}`,
      lastModified: activity.createdAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('sitemap: failed to fetch published activities', error);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/tentang-kami`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/program`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kegiatan`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/galeri`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/donasi`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/transparansi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kontak`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/kebijakan-privasi`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/ketentuan-donasi`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...articleUrls,
    ...activityUrls,
  ];
}
