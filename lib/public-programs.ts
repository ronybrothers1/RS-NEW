import {
  unstable_cache,
} from "next/cache";
import {
  asc,
  desc,
  eq,
} from "drizzle-orm";

import {
  db,
} from "@/src/db";
import {
  programs,
} from "@/src/db/schema";

export const PUBLIC_PROGRAMS_CACHE_TAG =
  "public-programs";

async function loadActivePrograms() {
  return db
    .select({
      id:
        programs.id,
      name:
        programs.name,
      description:
        programs.description,
      icon:
        programs.icon,
    })
    .from(
      programs,
    )
    .where(
      eq(
        programs.status,
        "ACTIVE",
      ),
    )
    .orderBy(
      programs.createdAt,
    )
    .limit(6);
}

export const getCachedActivePrograms =
  unstable_cache(
    loadActivePrograms,
    [
      "public-active-programs-v1",
    ],
    {
      revalidate:
        300,
      tags: [
        PUBLIC_PROGRAMS_CACHE_TAG,
      ],
    },
  );

async function loadActiveDonationPrograms() {
  return db
    .select({
      id:
        programs.id,
      name:
        programs.name,
    })
    .from(
      programs,
    )
    .where(
      eq(
        programs.status,
        "ACTIVE",
      ),
    )
    .orderBy(
      asc(
        programs.name,
      ),
    );
}

export const getCachedActiveDonationPrograms =
  unstable_cache(
    loadActiveDonationPrograms,
    [
      "public-active-donation-programs-v1",
    ],
    {
      revalidate:
        300,
      tags: [
        PUBLIC_PROGRAMS_CACHE_TAG,
      ],
    },
  );

async function loadAllActivePrograms() {
  return db
    .select({
      id:
        programs.id,
      name:
        programs.name,
      description:
        programs.description,
      icon:
        programs.icon,
    })
    .from(
      programs,
    )
    .where(
      eq(
        programs.status,
        "ACTIVE",
      ),
    )
    .orderBy(
      desc(
        programs.createdAt,
      ),
    );
}

export const getCachedAllActivePrograms =
  unstable_cache(
    loadAllActivePrograms,
    [
      "public-all-active-programs-v1",
    ],
    {
      revalidate:
        300,
      tags: [
        PUBLIC_PROGRAMS_CACHE_TAG,
      ],
    },
  );
