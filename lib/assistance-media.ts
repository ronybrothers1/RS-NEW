export const ASSISTANCE_MEDIA_BASE_PATH =
  "media/pengajuan";

export const ASSISTANCE_MEDIA_MAX_SIZE =
  5 * 1024 * 1024;

export const ASSISTANCE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function getAssistanceBlobToken() {
  return (
    process.env
      .ASSISTANCE_READ_WRITE_TOKEN
      ?.trim() || null
  );
}

export function getAssistanceUserMediaPrefix(
  userId: string,
) {
  return `${ASSISTANCE_MEDIA_BASE_PATH}/${userId}/`;
}

export function isAllowedAssistanceUserPath(
  pathname: string,
  userId: string,
) {
  return pathname.startsWith(
    getAssistanceUserMediaPrefix(
      userId,
    ),
  );
}

export function isPrivateAssistanceBlobUrl(
  value: string,
  pathname: string,
) {
  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(
        ".private.blob.vercel-storage.com",
      )
    ) {
      return false;
    }

    const urlPath =
      decodeURIComponent(
        url.pathname.replace(
          /^\/+/, 
          "",
        ),
      );

    return urlPath === pathname;
  } catch {
    return false;
  }
}
