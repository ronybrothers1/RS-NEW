import dotenv from "dotenv";
import {
  OAuth2Client,
} from "google-auth-library";

import {
  createGoogleDriveStorage,
  toGoogleDriveLocator,
} from "../lib/storage/providers/google-drive";

dotenv.config({
  path: ".env.local",
});

const REQUIRED_ENV_KEYS = [
  "GOOGLE_DRIVE_CLIENT_ID",
  "GOOGLE_DRIVE_CLIENT_SECRET",
  "GOOGLE_DRIVE_REFRESH_TOKEN",
  "GOOGLE_DRIVE_DONATION_FOLDER_ID",
] as const;

const DRIVE_UPLOAD_ENDPOINT =
  "https://www.googleapis.com/upload/drive/v3/files";

const TEST_CONTENT =
  "Ruang Sejahtera Google Drive storage smoke test";

const TEST_CONTENT_TYPE =
  "text/plain; charset=utf-8";

const TEST_FILE_NAME =
  `rs-storage-smoke-${Date.now()}.txt`;

function requireEnv(
  key: (typeof REQUIRED_ENV_KEYS)[number],
) {
  const value =
    process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `${key} belum tersedia di .env.local`,
    );
  }

  return value;
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function getAccessToken(
  client: OAuth2Client,
) {
  const result =
    await client.getAccessToken();

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

async function uploadTestFile(
  client: OAuth2Client,
  folderId: string,
) {
  const token =
    await getAccessToken(
      client,
    );

  const metadata = {
    name:
      TEST_FILE_NAME,
    parents:
      [folderId],
    mimeType:
      "text/plain",
  };

  const form =
    new FormData();

  form.append(
    "metadata",
    new Blob(
      [
        JSON.stringify(
          metadata,
        ),
      ],
      {
        type:
          "application/json; charset=UTF-8",
      },
    ),
  );

  form.append(
    "media",
    new Blob(
      [TEST_CONTENT],
      {
        type:
          TEST_CONTENT_TYPE,
      },
    ),
  );

  const url =
    new URL(
      DRIVE_UPLOAD_ENDPOINT,
    );

  url.searchParams.set(
    "uploadType",
    "multipart",
  );

  url.searchParams.set(
    "fields",
    "id,name,mimeType,size,createdTime",
  );

  const response =
    await fetch(
      url,
      {
        method:
          "POST",
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
        body:
          form,
      },
    );

  if (!response.ok) {
    let detail = "";

    try {
      const body =
        await response.json();

      detail =
        body?.error?.message
          ? `: ${body.error.message}`
          : "";
    } catch {
      detail = "";
    }

    throw new Error(
      `Upload smoke test gagal (HTTP ${response.status})${detail}`,
    );
  }

  const result =
    (await response.json()) as {
      id?: string;
    };

  assert(
    typeof result.id ===
      "string" &&
      result.id.length > 0,
    "Google Drive tidak mengembalikan file ID.",
  );

  return result.id;
}

async function main() {
  const clientId =
    requireEnv(
      "GOOGLE_DRIVE_CLIENT_ID",
    );

  const clientSecret =
    requireEnv(
      "GOOGLE_DRIVE_CLIENT_SECRET",
    );

  const refreshToken =
    requireEnv(
      "GOOGLE_DRIVE_REFRESH_TOKEN",
    );

  const donationFolderId =
    requireEnv(
      "GOOGLE_DRIVE_DONATION_FOLDER_ID",
    );

  const oauthClient =
    new OAuth2Client(
      clientId,
      clientSecret,
    );

  oauthClient.setCredentials({
    refresh_token:
      refreshToken,
  });

  const storage =
    createGoogleDriveStorage({
      clientId,
      clientSecret,
      refreshToken,
    });

  let fileId:
    string | null = null;

  try {
    console.log(
      "1/5 Upload file uji ke folder donasi...",
    );

    fileId =
      await uploadTestFile(
        oauthClient,
        donationFolderId,
      );

    const locator =
      toGoogleDriveLocator(
        fileId,
      );

    console.log(
      "2/5 HEAD melalui Google Drive storage adapter...",
    );

    const metadata =
      await storage.head(
        locator,
      );

    assert(
      metadata.pathname ===
        fileId,
      "HEAD mengembalikan file ID yang berbeda.",
    );

    assert(
      metadata.contentType.startsWith(
        "text/plain",
      ),
      `Content-Type tidak sesuai: ${metadata.contentType}`,
    );

    assert(
      metadata.size ===
        Buffer.byteLength(
          TEST_CONTENT,
          "utf8",
        ),
      `Ukuran file tidak sesuai: ${metadata.size}`,
    );

    console.log(
      "3/5 READ melalui Google Drive storage adapter...",
    );

    const readResult =
      await storage.read(
        locator,
      );

    assert(
      readResult,
      "READ mengembalikan null.",
    );

    const content =
      await new Response(
        readResult.stream,
      ).text();

    assert(
      content ===
        TEST_CONTENT,
      "Isi file hasil READ berbeda dari file uji.",
    );

    console.log(
      "4/5 DELETE melalui Google Drive storage adapter...",
    );

    await storage.delete(
      locator,
    );

    fileId = null;

    console.log(
      "5/5 Verifikasi file sudah tidak dapat dibaca...",
    );

    const afterDelete =
      await storage.read(
        locator,
      );

    assert(
      afterDelete === null,
      "File uji masih dapat dibaca setelah DELETE.",
    );

    console.log(
      "\nPASS: Google Drive storage smoke test berhasil.",
    );
    console.log(
      "Upload -> head -> read -> verify -> delete -> verify-not-found semuanya PASS.",
    );
    console.log(
      "File uji sudah dihapus. Tidak ada media produksi yang disentuh.",
    );
  } finally {
    if (fileId) {
      try {
        await storage.delete(
          toGoogleDriveLocator(
            fileId,
          ),
        );

        console.log(
          "Cleanup: file uji sisa berhasil dihapus.",
        );
      } catch (error) {
        console.error(
          "Cleanup warning: file uji mungkin masih tersisa:",
          error,
        );
      }
    }
  }
}

main().catch(
  (error) => {
    console.error(
      "\nSmoke test Google Drive gagal:",
      error instanceof Error
        ? error.message
        : error,
    );

    process.exitCode =
      1;
  },
);
