import {
  MetadataRoute,
} from "next";
import {
  eq,
  inArray,
} from "drizzle-orm";

import {
  getSiteUrl,
} from "@/lib/site-url";
import {
  db,
} from "@/src/db";
import {
  activities,
  articles,
  campaigns,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    getSiteUrl();

  const articleUrlsPromise =
    (async (): Promise<MetadataRoute.Sitemap> => {
      try {
        const publishedArticles =
          await db
            .select({
              slug:
                articles.slug,
              createdAt:
                articles.createdAt,
              publishedAt:
                articles.publishedAt,
              updatedAt:
                articles.updatedAt,
            })
            .from(articles)
            .where(
              eq(
                articles.status,
                "PUBLISHED",
              ),
            );

        return publishedArticles.map(
          (article) => ({
            url:
              `${baseUrl}/berita/${article.slug}`,
            lastModified:
              article.updatedAt ??
              article.publishedAt ??
              article.createdAt,
            changeFrequency:
              "weekly" as const,
            priority: 0.8,
          }),
        );
      } catch (error) {
        console.error(
          "sitemap: failed to fetch published articles",
          error,
        );

        return [];
      }
    })();

  const activityUrlsPromise =
    (async (): Promise<MetadataRoute.Sitemap> => {
      try {
        const publishedActivities =
          await db
            .select({
              slug:
                activities.slug,
              updatedAt:
                activities.updatedAt,
            })
            .from(activities)
            .where(
              eq(
                activities.isPublished,
                true,
              ),
            );

        return publishedActivities.map(
          (activity) => ({
            url:
              `${baseUrl}/kegiatan/${activity.slug}`,
            lastModified:
              activity.updatedAt,
            changeFrequency:
              "weekly" as const,
            priority: 0.8,
          }),
        );
      } catch (error) {
        console.error(
          "sitemap: failed to fetch published activities",
          error,
        );

        return [];
      }
    })();

  const campaignUrlsPromise =
    (async (): Promise<MetadataRoute.Sitemap> => {
      try {
        const publicCampaigns =
          await db
            .select({
              slug:
                campaigns.slug,
              updatedAt:
                campaigns.updatedAt,
            })
            .from(campaigns)
            .where(
              inArray(
                campaigns.status,
                [
                  "ACTIVE",
                  "COMPLETED",
                ],
              ),
            );

        return publicCampaigns.map(
          (campaign) => ({
            url:
              `${baseUrl}/bantuan/${campaign.slug}`,
            lastModified:
              campaign.updatedAt,
            changeFrequency:
              "daily" as const,
            priority: 0.9,
          }),
        );
      } catch (error) {
        console.error(
          "sitemap: failed to fetch public campaigns",
          error,
        );

        return [];
      }
    })();

  const [
    articleUrls,
    activityUrls,
    campaignUrls,
  ] =
    await Promise.all([
      articleUrlsPromise,
      activityUrlsPromise,
      campaignUrlsPromise,
    ]);

  return [
    {
      url: baseUrl,

      changeFrequency:
        "daily",
      priority: 1,
    },
    {
      url:
        `${baseUrl}/tentang-kami`,

      changeFrequency:
        "monthly",
      priority: 0.8,
    },
    {
      url:
        `${baseUrl}/program`,

      changeFrequency:
        "monthly",
      priority: 0.8,
    },
    {
      url:
        `${baseUrl}/berita`,

      changeFrequency:
        "daily",
      priority: 0.9,
    },
    {
      url:
        `${baseUrl}/kegiatan`,

      changeFrequency:
        "daily",
      priority: 0.9,
    },
    {
      url:
        `${baseUrl}/bantuan`,

      changeFrequency:
        "daily",
      priority: 0.95,
    },
    {
      url:
        `${baseUrl}/donasi`,

      changeFrequency:
        "monthly",
      priority: 0.9,
    },
    {
      url:
        `${baseUrl}/transparansi`,

      changeFrequency:
        "weekly",
      priority: 0.8,
    },
    {
      url:
        `${baseUrl}/kontak`,

      changeFrequency:
        "yearly",
      priority: 0.6,
    },
    {
      url:
        `${baseUrl}/kebijakan-privasi`,

      changeFrequency:
        "yearly",
      priority: 0.3,
    },
    {
      url:
        `${baseUrl}/ketentuan-donasi`,

      changeFrequency:
        "yearly",
      priority: 0.3,
    },
    ...articleUrls,
    ...activityUrls,
    ...campaignUrls,
  ];
}