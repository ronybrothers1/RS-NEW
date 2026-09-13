import {
  OAuth2Client,
} from "google-auth-library";

import type {
  StorageAdapter,
  StorageMetadata,
  StorageReadResult,
} from "@/lib/storage/contracts";

const DRIVE_FILES_ENDPOINT =
  "https://www.googleapis.com/drive/v3/files";

export const GOOGLE_DRIVE_LOCATOR_PREFIX =
  "gdrive:";

type GoogleDriveStorageOptions = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

type GoogleDriveFileMetadata = {
  id?: string;
  mimeType?: string;
  size?: string;
  createdTime?: string;
};

function requireCredential(
  value: string,
  label: string,
) {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `Google Drive ${label} belum tersedia.`,
    );
  }

  return normalized;
}

export function toGoogleDriveLocator(
  fileId: string,
) {
  const normalized =
    normalizeGoogleDriveFileId(
      fileId,
    );

  return `${GOOGLE_DRIVE_LOCATOR_PREFIX}${normalized}`;
}

export function getGoogleDriveFileId(
  locator: string,
) {
  const normalized =
    locator.trim();

  const fileId =
    normalized.startsWith(
      GOOGLE_DRIVE_LOCATOR_PREFIX,
    )
      ? normalized.slice(
          GOOGLE_DRIVE_LOCATOR_PREFIX.length,
        )
      : normalized;

  return normalizeGoogleDriveFileId(
    fileId,
  );
}

function normalizeGoogleDriveFileId(
  value: string,
) {
  const normalized =
    value.trim();

  if (
    !normalized ||
    !/^[A-Za-z0-9_-]+$/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Google Drive file ID tidak valid.",
    );
  }

  return normalized;
}

function parseFileSize(
  value: string | undefined,
) {
  if (
    !value ||
    !/^\d+$/.test(value)
  ) {
    throw new Error(
      "Google Drive tidak menyediakan ukuran file biner yang valid.",
    );
  }

  const size = Number(value);

  if (
    !Number.isSafeInteger(size) ||
    size < 0
  ) {
    throw new Error(
      "Ukuran file Google Drive tidak valid.",
    );
  }

  return size;
}

function parseCreatedTime(
  value: string | undefined,
) {
  if (!value) {
    throw new Error(
      "Google Drive tidak menyediakan waktu pembuatan file.",
    );
  }

  const createdAt =
    new Date(value);

  if (
    Number.isNaN(
      createdAt.getTime(),
    )
  ) {
    throw new Error(
      "Waktu pembuatan file Google Drive tidak valid.",
    );
  }

  return createdAt;
}

function assertDriveResponse(
  response: Response,
  operation: string,
) {
  if (response.ok) {
    return;
  }

  throw new Error(
    `Google Drive ${operation} gagal (HTTP ${response.status}).`,
  );
}

export function createGoogleDriveStorage({
  clientId,
  clientSecret,
  refreshToken,
}: GoogleDriveStorageOptions): StorageAdapter {
  const oauthClient =
    new OAuth2Client(
      requireCredential(
        clientId,
        "client ID",
      ),
      requireCredential(
        clientSecret,
        "client secret",
      ),
    );

  oauthClient.setCredentials({
    refresh_token:
      requireCredential(
        refreshToken,
        "refresh token",
      ),
  });

  async function getAccessToken() {
    const result =
      await oauthClient.getAccessToken();

    const token =
      typeof result === "string"
        ? result
        : result.token;

    if (!token) {
      throw new Error(
        "Google Drive access token tidak dapat diperoleh.",
      );
    }

    return token;
  }

  async function requestFile(
    fileId: string,
    options: {
      method?: "GET" | "DELETE";
      query?: Record<
        string,
        string
      >;
    } = {},
  ) {
    const url =
      new URL(
        `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(
          fileId,
        )}`,
      );

    url.searchParams.set(
      "supportsAllDrives",
      "true",
    );

    for (
      const [
        key,
        value,
      ] of Object.entries(
        options.query || {},
      )
    ) {
      url.searchParams.set(
        key,
        value,
      );
    }

    const token =
      await getAccessToken();

    return fetch(
      url,
      {
        method:
          options.method ||
          "GET",
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
  }

  async function read(
    locator: string,
  ): Promise<StorageReadResult | null> {
    const fileId =
      getGoogleDriveFileId(
        locator,
      );

    const response =
      await requestFile(
        fileId,
        {
          query: {
            alt: "media",
          },
        },
      );

    if (
      response.status ===
      404
    ) {
      return null;
    }

    assertDriveResponse(
      response,
      "read",
    );

    if (!response.body) {
      return null;
    }

    return {
      stream:
        response.body,
      contentType:
        response.headers.get(
          "content-type",
        ) ||
        "application/octet-stream",
      statusCode: 200,
    };
  }

  async function head(
    locator: string,
  ): Promise<StorageMetadata> {
    const fileId =
      getGoogleDriveFileId(
        locator,
      );

    const response =
      await requestFile(
        fileId,
        {
          query: {
            fields:
              "id,mimeType,size,createdTime",
          },
        },
      );

    assertDriveResponse(
      response,
      "head",
    );

    const metadata =
      (await response.json()) as
        GoogleDriveFileMetadata;

    if (
      !metadata.id ||
      metadata.id !== fileId
    ) {
      throw new Error(
        "Google Drive mengembalikan metadata file yang tidak sesuai.",
      );
    }

    const storageLocator =
      toGoogleDriveLocator(
        fileId,
      );

    return {
      size:
        parseFileSize(
          metadata.size,
        ),
      uploadedAt:
        parseCreatedTime(
          metadata.createdTime,
        ),
      pathname:
        fileId,
      contentType:
        metadata.mimeType ||
        "application/octet-stream",
      url:
        storageLocator,
      downloadUrl:
        storageLocator,
    };
  }

  async function deleteObject(
    locator: string,
  ) {
    const fileId =
      getGoogleDriveFileId(
        locator,
      );

    const response =
      await requestFile(
        fileId,
        {
          method: "DELETE",
        },
      );

    if (
      response.status ===
      404
    ) {
      return;
    }

    assertDriveResponse(
      response,
      "delete",
    );
  }

  return {
    provider:
      "google-drive",
    access:
      "private",
    read,
    head,
    async delete(locator) {
      const locators =
        Array.isArray(locator)
          ? locator
          : [locator];

      for (
        const item of
        locators
      ) {
        await deleteObject(
          item,
        );
      }
    },
  };
}
