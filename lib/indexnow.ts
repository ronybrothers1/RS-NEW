const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_HOST = "www.ruangsejahtera.com";
const INDEXNOW_ORIGIN = `https://${INDEXNOW_HOST}`;
const INDEXNOW_KEY = "9b5039a5-2225-47be-b837-5f370483ceda";
const INDEXNOW_KEY_LOCATION = `${INDEXNOW_ORIGIN}/${INDEXNOW_KEY}.txt`;

const MAX_URLS_PER_EVENT = 10;
const REQUEST_TIMEOUT_MS = 3000;

function normalizeIndexNowUrl(value: string): string | null {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return null;
    }

    if (url.hostname !== INDEXNOW_HOST) {
      return null;
    }

    if (url.username || url.password) {
      return null;
    }

    url.hash = "";

    return url.toString();
  } catch {
    return null;
  }
}

export async function notifyIndexNow(
  urls: string[],
): Promise<void> {
  if (process.env.VERCEL_ENV !== "production") {
    return;
  }

  const urlList = Array.from(
    new Set(
      urls
        .map(normalizeIndexNowUrl)
        .filter((url): url is string => Boolean(url)),
    ),
  ).slice(0, MAX_URLS_PER_EVENT);

  if (urlList.length === 0) {
    return;
  }

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(
        `IndexNow submission failed with HTTP ${response.status}.`,
      );
    }
  } catch (error) {
    console.warn(
      "IndexNow submission failed.",
      error instanceof Error ? error.message : error,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function buildPublicArticleUrl(
  slug: string,
): string {
  return `${INDEXNOW_ORIGIN}/berita/${encodeURIComponent(slug)}`;
}