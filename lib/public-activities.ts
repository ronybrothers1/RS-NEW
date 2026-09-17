import {
  unstable_cache,
} from "next/cache";
import {
  and,
  desc,
  eq,
  isNull,
} from "drizzle-orm";

import {
  PUBLIC_PROGRAMS_CACHE_TAG,
} from "@/lib/public-programs";
import {
  db,
} from "@/src/db";
import {
  activities,
  programs,
} from "@/src/db/schema";

export const PUBLIC_ACTIVITIES_CACHE_TAG =
  "public-activities";

const PUBLIC_ACTIVITIES_REVALIDATE_SECONDS =
  300;

type CachedPublicActivityListItem = {
  activity: {
    id: string;
    slug: string;
    title: string;
    date: string;
    location: string | null;
    description: string | null;
    tiktokUrl: string | null;
  };
  programName: string | null;
};

type CachedPublicActivityDetail = {
  activity: {
    title: string;
    slug: string;
    description: string | null;
    date: string;
    location: string | null;
    tiktokUrl: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  programName: string | null;
};

async function loadPublishedActivities(): Promise<
  CachedPublicActivityListItem[]
> {
  const rows =
    await db
      .select({
        id:
          activities.id,
        slug:
          activities.slug,
        title:
          activities.title,
        date:
          activities.date,
        location:
          activities.location,
        description:
          activities.description,
        tiktokUrl:
          activities.tiktokUrl,
        programName:
          programs.name,
      })
      .from(
        activities,
      )
      .leftJoin(
        programs,
        eq(
          activities.programId,
          programs.id,
        ),
      )
      .where(
        and(
          eq(
            activities.isPublished,
            true,
          ),
          isNull(
            activities.archivedAt,
          ),
        ),
      )
      .orderBy(
        desc(
          activities.date,
        ),
        desc(
          activities.createdAt,
        ),
      );

  return rows.map(
    (row) => ({
      activity: {
        id:
          row.id,
        slug:
          row.slug,
        title:
          row.title,
        date:
          row.date.toISOString(),
        location:
          row.location,
        description:
          row.description,
        tiktokUrl:
          row.tiktokUrl,
      },
      programName:
        row.programName,
    }),
  );
}

const getCachedPublishedActivitiesData =
  unstable_cache(
    loadPublishedActivities,
    [
      "public-published-activities-v1",
    ],
    {
      revalidate:
        PUBLIC_ACTIVITIES_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ACTIVITIES_CACHE_TAG,
        PUBLIC_PROGRAMS_CACHE_TAG,
      ],
    },
  );

export async function getCachedPublishedActivities() {
  const rows =
    await getCachedPublishedActivitiesData();

  return rows.map(
    (row) => ({
      ...row,
      activity: {
        ...row.activity,
        date:
          new Date(
            row.activity.date,
          ),
      },
    }),
  );
}

async function loadPublishedActivity(
  slug: string,
): Promise<CachedPublicActivityDetail | null> {
  const [
    row,
  ] =
    await db
      .select({
        title:
          activities.title,
        slug:
          activities.slug,
        description:
          activities.description,
        date:
          activities.date,
        location:
          activities.location,
        tiktokUrl:
          activities.tiktokUrl,
        imageUrl:
          activities.imageUrl,
        imageAlt:
          activities.imageAlt,
        createdAt:
          activities.createdAt,
        updatedAt:
          activities.updatedAt,
        programName:
          programs.name,
      })
      .from(
        activities,
      )
      .leftJoin(
        programs,
        eq(
          activities.programId,
          programs.id,
        ),
      )
      .where(
        and(
          eq(
            activities.slug,
            slug,
          ),
          eq(
            activities.isPublished,
            true,
          ),
          isNull(
            activities.archivedAt,
          ),
        ),
      )
      .limit(1);

  if (!row) {
    return null;
  }

  return {
    activity: {
      title:
        row.title,
      slug:
        row.slug,
      description:
        row.description,
      date:
        row.date.toISOString(),
      location:
        row.location,
      tiktokUrl:
        row.tiktokUrl,
      imageUrl:
        row.imageUrl,
      imageAlt:
        row.imageAlt,
      createdAt:
        row.createdAt.toISOString(),
      updatedAt:
        row.updatedAt.toISOString(),
    },
    programName:
      row.programName,
  };
}

const getCachedPublishedActivityData =
  unstable_cache(
    loadPublishedActivity,
    [
      "public-published-activity-v1",
    ],
    {
      revalidate:
        PUBLIC_ACTIVITIES_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ACTIVITIES_CACHE_TAG,
        PUBLIC_PROGRAMS_CACHE_TAG,
      ],
    },
  );

export async function getCachedPublishedActivity(
  slug: string,
) {
  const row =
    await getCachedPublishedActivityData(
      slug,
    );

  if (!row) {
    return null;
  }

  return {
    ...row,
    activity: {
      ...row.activity,
      date:
        new Date(
          row.activity.date,
        ),
      createdAt:
        new Date(
          row.activity.createdAt,
        ),
      updatedAt:
        new Date(
          row.activity.updatedAt,
        ),
    },
  };
}