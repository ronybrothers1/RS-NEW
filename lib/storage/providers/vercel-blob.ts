import {
  del,
  get,
  head,
  list,
} from "@vercel/blob";

import type {
  ListableStorageAdapter,
  StorageAccess,
} from "@/lib/storage/contracts";

type VercelBlobStorageOptions = {
  access: StorageAccess;
  token?: string;
};

export function createVercelBlobStorage({
  access,
  token,
}: VercelBlobStorageOptions): ListableStorageAdapter {
  const authOptions =
    token
      ? { token }
      : undefined;

  return {
    provider: "vercel-blob",
    access,

    async read(locator) {
      const result =
        await get(
          locator,
          {
            access,
            ...(authOptions || {}),
          },
        );

      if (
        !result ||
        result.statusCode !== 200 ||
        !result.stream
      ) {
        return null;
      }

      return {
        stream:
          result.stream,
        contentType:
          result.blob.contentType ||
          "application/octet-stream",
        statusCode: 200,
      };
    },

    async head(locator) {
      const metadata =
        await head(
          locator,
          authOptions,
        );

      return {
        size: metadata.size,
        uploadedAt:
          metadata.uploadedAt,
        pathname:
          metadata.pathname,
        contentType:
          metadata.contentType,
        url: metadata.url,
        downloadUrl:
          metadata.downloadUrl,
        etag: metadata.etag,
      };
    },

    async delete(locator) {
      await del(
        locator,
        authOptions,
      );
    },

    async list(options = {}) {
      const result =
        await list({
          ...options,
          ...(authOptions || {}),
        });

      return {
        objects:
          result.blobs.map(
            (blob) => ({
              url: blob.url,
              downloadUrl:
                blob.downloadUrl,
              pathname:
                blob.pathname,
              size: blob.size,
              uploadedAt:
                blob.uploadedAt,
              etag: blob.etag,
            }),
          ),
        cursor:
          result.cursor,
        hasMore:
          result.hasMore,
      };
    },
  };
}
