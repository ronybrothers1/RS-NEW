import {
  unstable_cache,
} from "next/cache";

import {
  db,
} from "@/src/db";
import {
  settings,
} from "@/src/db/schema";

export const PUBLIC_SETTINGS_CACHE_TAG =
  "public-settings";

async function loadPublicSettings() {
  const settingsData =
    await db
      .select({
        key:
          settings.key,
        value:
          settings.value,
      })
      .from(
        settings,
      );

  return settingsData.reduce(
    (
      accumulator,
      current,
    ) => {
      accumulator[
        current.key
      ] =
        current.value;

      return accumulator;
    },
    {} as Record<
      string,
      string
    >,
  );
}

export const getCachedPublicSettings =
  unstable_cache(
    loadPublicSettings,
    [
      "public-settings",
    ],
    {
      revalidate:
        3600,
      tags: [
        PUBLIC_SETTINGS_CACHE_TAG,
      ],
    },
  );