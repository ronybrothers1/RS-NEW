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

const DRIVE_UPLOAD_ENDPOINT =
  "https://www.googleapis.com/upload/drive/v3/files";

export const GOOGLE_DRIVE_LOCATOR_PREFIX =
  "gdrive:";

type GoogleDriveStorageOptions = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export type GoogleDriveResumableUploadInput = {
  folderId: string;
  filename: string;
  contentType: string;
  size: number;
};

export type GoogleDriveStorageAdapter =
  StorageAdapter & {
    getParents(
      locator: string,
    ): Promise<string[]>;

    getName(
      locator: string,
    ): Promise<string>;

    createResumableUploadSession(
      input: GoogleDriveResumableUploadInput,
    ): Promise<string>;
  };

type GoogleDriveFileMetadata = {
  id?: string;
  name?: string;
  mimeType?: string;
  size?: string;
  createdTime?: string;
  parents?: string[];
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

function normalizeUploadFilename(
  value: string,
) {
  const normalized =
    value.trim();

  if (
    !normalized ||
    normalized.length > 180
  ) {
    throw new Error(
      "Nama file Google Drive tidak valid.",
    );
  }

  return normalized;
}

function normalizeContentType(
  value: string,
) {
  const normalized =
    value.trim().toLowerCase();

  if (!normalized) {
    throw new Error(
      "Content-Type Google Drive tidak valid.",
    );
  }

  return normalized;
}

function normalizeUploadSize(
  value: number,
) {
  if (
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      "Ukuran upload Google Drive tidak valid.",
    );
  }

  return value;
}

export function createGoogleDriveStorage({
  clientId,
  clientSecret,
  refreshToken,
}: GoogleDriveStorageOptions): GoogleDriveStorageAdapter {
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

  async function getParents(
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
          query: {
            fields:
              "id,parents",
          },
        },
      );

    assertDriveResponse(
      response,
      "parents",
    );

    const metadata =
      (await response.json()) as
        GoogleDriveFileMetadata;

    if (
      !metadata.id ||
      metadata.id !== fileId
    ) {
      throw new Error(
        "Google Drive mengembalikan parent file yang tidak sesuai.",
      );
    }

    return (
      metadata.parents || []
    ).filter(
      (
        parentId,
      ): parentId is string =>
        typeof parentId ===
          "string" &&
        /^[A-Za-z0-9_-]+$/.test(
          parentId,
        ),
    );
  }

  async function getName(
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
          query: {
            fields:
              "id,name",
          },
        },
      );

    assertDriveResponse(
      response,
      "name",
    );

    const metadata =
      (await response.json()) as
        GoogleDriveFileMetadata;

    if (
      !metadata.id ||
      metadata.id !==
        fileId ||
      typeof metadata.name !==
        "string" ||
      !metadata.name.trim()
    ) {
      throw new Error(
        "Google Drive mengembalikan nama file yang tidak valid.",
      );
    }

    return metadata.name;
  }

  async function createResumableUploadSession({
    folderId,
    filename,
    contentType,
    size,
  }: GoogleDriveResumableUploadInput) {
    const normalizedFolderId =
      normalizeGoogleDriveFileId(
        folderId,
      );

    const normalizedFilename =
      normalizeUploadFilename(
        filename,
      );

    const normalizedContentType =
      normalizeContentType(
        contentType,
      );

    const normalizedSize =
      normalizeUploadSize(
        size,
      );

    const url =
      new URL(
        DRIVE_UPLOAD_ENDPOINT,
      );

    url.searchParams.set(
      "uploadType",
      "resumable",
    );

    url.searchParams.set(
      "supportsAllDrives",
      "true",
    );

    url.searchParams.set(
      "fields",
      "id,mimeType,size,createdTime,parents",
    );

    const token =
      await getAccessToken();

    const response =
      await fetch(
        url,
        {
          method:
            "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json; charset=UTF-8",
            "X-Upload-Content-Type":
              normalizedContentType,
            "X-Upload-Content-Length":
              String(
                normalizedSize,
              ),
          },
          body:
            JSON.stringify({
              name:
                normalizedFilename,
              mimeType:
                normalizedContentType,
              parents: [
                normalizedFolderId,
              ],
            }),
          cache: "no-store",
        },
      );

    assertDriveResponse(
      response,
      "resumable upload session",
    );

    const location =
      response.headers.get(
        "location",
      );

    if (!location) {
      throw new Error(
        "Google Drive tidak mengembalikan URL sesi upload.",
      );
    }

    const sessionUrl =
      new URL(location);

    if (
      sessionUrl.protocol !==
        "https:" ||
      sessionUrl.hostname !==
        "www.googleapis.com" ||
      !sessionUrl.pathname.startsWith(
        "/upload/drive/v3/files",
      )
    ) {
      throw new Error(
        "URL sesi upload Google Drive tidak valid.",
      );
    }

    return sessionUrl.toString();
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
    getParents,
    getName,
    createResumableUploadSession,
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
