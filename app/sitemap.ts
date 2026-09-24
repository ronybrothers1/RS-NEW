import {
  MetadataRoute,
} from "next";
import {
  unstable_cache,
} from "next/cache";
import {
  eq,
  inArray,
} from "drizzle-orm";

import {
  PUBLIC_ACTIVITIES_CACHE_TAG,
} from "@/lib/public-activities";
import {
  PUBLIC_ARTICLES_CACHE_TAG,
} from "@/lib/public-articles";
import {
  PUBLIC_ASSISTANCE_CACHE_TAG,
} from "@/lib/public-assistance";
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

const SITEMAP_REVALIDATE_SECONDS =
  300;

const STATIC_PAGE_LAST_MODIFIED = {
  about:
    "2026-09-18T04:31:22.000Z",
  privacy:
    "2026-09-08T00:00:00.000Z",
  donationTerms:
    "2026-09-08T00:00:00.000Z",
} as const;

function getLatestLastModified(
  entries: MetadataRoute.Sitemap,
): string | undefined {
  let latestTimestamp = 0;

  for (const entry of entries) {
    if (!entry.lastModified) {
      continue;
    }

    const timestamp =
      entry.lastModified instanceof Date
        ? entry.lastModified.getTime()
        : Date.parse(
            entry.lastModified,
          );

    if (
      Number.isFinite(timestamp) &&
      timestamp > latestTimestamp
    ) {
      latestTimestamp =
        timestamp;
    }
  }

  return latestTimestamp > 0
    ? new Date(
        latestTimestamp,
      ).toISOString()
    : undefined;
}

async function loadPublishedArticleSitemap(
  baseUrl: string,
): Promise<MetadataRoute.Sitemap> {
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
        (
          article.updatedAt ??
          article.publishedAt ??
          article.createdAt
        ).toISOString(),
      changeFrequency:
        "weekly" as const,
      priority: 0.8,
    }),
  );
}

const getCachedPublishedArticleSitemap =
  unstable_cache(
    loadPublishedArticleSitemap,
    [
      "sitemap-published-articles-v1",
    ],
    {
      revalidate:
        SITEMAP_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ARTICLES_CACHE_TAG,
      ],
    },
  );

async function loadPublishedActivitySitemap(
  baseUrl: string,
): Promise<MetadataRoute.Sitemap> {
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
        activity.updatedAt.toISOString(),
      changeFrequency:
        "weekly" as const,
      priority: 0.8,
    }),
  );
}

const getCachedPublishedActivitySitemap =
  unstable_cache(
    loadPublishedActivitySitemap,
    [
      "sitemap-published-activities-v1",
    ],
    {
      revalidate:
        SITEMAP_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ACTIVITIES_CACHE_TAG,
      ],
    },
  );

async function loadPublicCampaignSitemap(
  baseUrl: string,
): Promise<MetadataRoute.Sitemap> {
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
        campaign.updatedAt.toISOString(),
      changeFrequency:
        "daily" as const,
      priority: 0.9,
    }),
  );
}

const getCachedPublicCampaignSitemap =
  unstable_cache(
    loadPublicCampaignSitemap,
    [
      "sitemap-public-campaigns-v1",
    ],
    {
      revalidate:
        SITEMAP_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ASSISTANCE_CACHE_TAG,
      ],
    },
  );

export const dynamic =
  "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    getSiteUrl();

  const articleUrlsPromise =
    (async (): Promise<MetadataRoute.Sitemap> => {
      try {
        const urls =
          await getCachedPublishedArticleSitemap(
            baseUrl,
          );

        return urls;
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
        const urls =
          await getCachedPublishedActivitySitemap(
            baseUrl,
          );

        return urls;
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
        const urls =
          await getCachedPublicCampaignSitemap(
            baseUrl,
          );

        return urls;
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

  const articleIndexLastModified =
    getLatestLastModified(
      articleUrls,
    );

  const activityIndexLastModified =
    getLatestLastModified(
      activityUrls,
    );

  const assistanceIndexLastModified =
    getLatestLastModified(
      campaignUrls,
    );

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
      lastModified:
        STATIC_PAGE_LAST_MODIFIED.about,

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
      lastModified:
        articleIndexLastModified,

      changeFrequency:
        "daily",
      priority: 0.9,
    },
    {
      url:
        `${baseUrl}/kegiatan`,
      lastModified:
        activityIndexLastModified,

      changeFrequency:
        "daily",
      priority: 0.9,
    },
    {
      url:
        `${baseUrl}/bantuan`,
      lastModified:
        assistanceIndexLastModified,

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
      lastModified:
        STATIC_PAGE_LAST_MODIFIED.privacy,

      changeFrequency:
        "yearly",
      priority: 0.3,
    },
    {
      url:
        `${baseUrl}/ketentuan-donasi`,
      lastModified:
        STATIC_PAGE_LAST_MODIFIED.donationTerms,

      changeFrequency:
        "yearly",
      priority: 0.3,
    },
    ...articleUrls,
    ...activityUrls,
    ...campaignUrls,
  ];
}