import {
  createServer,
} from "node:http";
import {
  randomBytes,
} from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {
  resolve,
} from "node:path";

import {
  OAuth2Client,
} from "google-auth-library";

const DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.file";

const DRIVE_FILES_ENDPOINT =
  "https://www.googleapis.com/drive/v3/files";

const FOLDER_MIME_TYPE =
  "application/vnd.google-apps.folder";

const ROOT_FOLDER_NAME =
  "Ruang Sejahtera Private Media";

const CHILD_FOLDERS = [
  {
    envKey:
      "GOOGLE_DRIVE_DONATION_FOLDER_ID",
    name:
      "donasi",
  },
  {
    envKey:
      "GOOGLE_DRIVE_ASSISTANCE_FOLDER_ID",
    name:
      "pengajuan",
  },
];

const CALLBACK_PATH =
  "/oauth2callback";

const CALLBACK_TIMEOUT_MS =
  5 * 60 * 1000;

function fail(message) {
  throw new Error(message);
}

function requireText(
  value,
  label,
) {
  const normalized =
    typeof value === "string"
      ? value.trim()
      : "";

  if (!normalized) {
    fail(
      `${label} tidak ditemukan.`,
    );
  }

  return normalized;
}

function readDesktopClient(
  credentialsPath,
) {
  let parsed;

  try {
    parsed =
      JSON.parse(
        readFileSync(
          credentialsPath,
          "utf8",
        ),
      );
  } catch (error) {
    fail(
      `File OAuth client tidak dapat dibaca: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !parsed.installed
  ) {
    fail(
      "OAuth client JSON harus bertipe Desktop app (objek installed).",
    );
  }

  return {
    clientId:
      requireText(
        parsed.installed.client_id,
        "OAuth client ID",
      ),
    clientSecret:
      requireText(
        parsed.installed.client_secret,
        "OAuth client secret",
      ),
  };
}

async function startCallbackServer(
  expectedState,
) {
  let resolveCode;
  let rejectCode;

  const codePromise =
    new Promise(
      (
        resolvePromise,
        rejectPromise,
      ) => {
        resolveCode =
          resolvePromise;
        rejectCode =
          rejectPromise;
      },
    );

  const server =
    createServer(
      (
        request,
        response,
      ) => {
        try {
          const requestUrl =
            new URL(
              request.url || "/",
              "http://127.0.0.1",
            );

          if (
            requestUrl.pathname !==
            CALLBACK_PATH
          ) {
            response.writeHead(
              404,
              {
                "Content-Type":
                  "text/plain; charset=utf-8",
              },
            );
            response.end(
              "Not Found",
            );
            return;
          }

          const error =
            requestUrl.searchParams.get(
              "error",
            );

          if (error) {
            response.writeHead(
              400,
              {
                "Content-Type":
                  "text/html; charset=utf-8",
              },
            );
            response.end(
              "<h1>Otorisasi dibatalkan.</h1><p>Kembali ke terminal.</p>",
            );
            rejectCode(
              new Error(
                `Google OAuth mengembalikan error: ${error}`,
              ),
            );
            return;
          }

          const state =
            requestUrl.searchParams.get(
              "state",
            );

          if (
            state !==
            expectedState
          ) {
            response.writeHead(
              400,
              {
                "Content-Type":
                  "text/html; charset=utf-8",
              },
            );
            response.end(
              "<h1>State OAuth tidak valid.</h1><p>Kembali ke terminal.</p>",
            );
            rejectCode(
              new Error(
                "State OAuth tidak sesuai.",
              ),
            );
            return;
          }

          const code =
            requestUrl.searchParams.get(
              "code",
            );

          if (!code) {
            response.writeHead(
              400,
              {
                "Content-Type":
                  "text/html; charset=utf-8",
              },
            );
            response.end(
              "<h1>Kode OAuth tidak ditemukan.</h1><p>Kembali ke terminal.</p>",
            );
            rejectCode(
              new Error(
                "Authorization code tidak ditemukan.",
              ),
            );
            return;
          }

          response.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8",
            },
          );
          response.end(
            "<h1>Otorisasi berhasil.</h1><p>Anda dapat menutup tab ini dan kembali ke terminal.</p>",
          );

          resolveCode(code);
        } catch (error) {
          rejectCode(error);
        }
      },
    );

  await new Promise(
    (
      resolvePromise,
      rejectPromise,
    ) => {
      server.once(
        "error",
        rejectPromise,
      );

      server.listen(
        0,
        "127.0.0.1",
        () => {
          server.off(
            "error",
            rejectPromise,
          );
          resolvePromise();
        },
      );
    },
  );

  const address =
    server.address();

  if (
    !address ||
    typeof address === "string"
  ) {
    server.close();
    fail(
      "Port callback OAuth tidak dapat ditentukan.",
    );
  }

  const timeout =
    setTimeout(
      () => {
        rejectCode(
          new Error(
            "Waktu otorisasi OAuth habis. Jalankan script kembali.",
          ),
        );
      },
      CALLBACK_TIMEOUT_MS,
    );

  timeout.unref();

  return {
    codePromise,
    close() {
      clearTimeout(timeout);
      server.close();
    },
    redirectUri:
      `http://127.0.0.1:${address.port}${CALLBACK_PATH}`,
  };
}

async function getAccessToken(
  oauthClient,
) {
  const result =
    await oauthClient.getAccessToken();

  const token =
    typeof result === "string"
      ? result
      : result.token;

  if (!token) {
    fail(
      "Google access token tidak dapat diperoleh.",
    );
  }

  return token;
}

async function driveRequest(
  oauthClient,
  url,
  options = {},
) {
  const token =
    await getAccessToken(
      oauthClient,
    );

  const response =
    await fetch(
      url,
      {
        ...options,
        headers: {
          Authorization:
            `Bearer ${token}`,
          ...(options.headers || {}),
        },
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

    fail(
      `Google Drive API gagal (HTTP ${response.status})${detail}`,
    );
  }

  return response;
}

function escapeDriveQuery(
  value,
) {
  return value
    .replace(
      /\\/g,
      "\\\\",
    )
    .replace(
      /'/g,
      "\\'",
    );
}

async function findFolder(
  oauthClient,
  name,
  parentId,
) {
  const url =
    new URL(
      DRIVE_FILES_ENDPOINT,
    );

  const q = [
    `name = '${escapeDriveQuery(name)}'`,
    `mimeType = '${FOLDER_MIME_TYPE}'`,
    `'${escapeDriveQuery(parentId)}' in parents`,
    "trashed = false",
  ].join(" and ");

  url.searchParams.set(
    "q",
    q,
  );
  url.searchParams.set(
    "spaces",
    "drive",
  );
  url.searchParams.set(
    "pageSize",
    "10",
  );
  url.searchParams.set(
    "fields",
    "files(id,name,parents)",
  );

  const response =
    await driveRequest(
      oauthClient,
      url,
    );

  const body =
    await response.json();

  const files =
    Array.isArray(body.files)
      ? body.files
      : [];

  if (files.length > 1) {
    fail(
      `Ditemukan lebih dari satu folder "${name}" pada parent yang sama. Rapikan Drive terlebih dahulu.`,
    );
  }

  return files[0]?.id || null;
}

async function createFolder(
  oauthClient,
  name,
  parentId,
) {
  const url =
    new URL(
      DRIVE_FILES_ENDPOINT,
    );

  url.searchParams.set(
    "fields",
    "id,name",
  );

  const response =
    await driveRequest(
      oauthClient,
      url,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            name,
            mimeType:
              FOLDER_MIME_TYPE,
            parents:
              [parentId],
          }),
      },
    );

  const body =
    await response.json();

  return requireText(
    body.id,
    `ID folder ${name}`,
  );
}

async function ensureFolder(
  oauthClient,
  name,
  parentId,
) {
  const existing =
    await findFolder(
      oauthClient,
      name,
      parentId,
    );

  if (existing) {
    return existing;
  }

  return createFolder(
    oauthClient,
    name,
    parentId,
  );
}

function assertEnvValue(
  value,
  key,
) {
  if (
    !value ||
    /[\r\n]/.test(value)
  ) {
    fail(
      `Nilai ${key} tidak valid untuk .env.local.`,
    );
  }

  return value;
}

function updateEnvLocal(
  entries,
) {
  const envPath =
    resolve(
      process.cwd(),
      ".env.local",
    );

  const existing =
    existsSync(envPath)
      ? readFileSync(
          envPath,
          "utf8",
        )
      : "";

  const eol =
    existing.includes("\r\n")
      ? "\r\n"
      : "\n";

  let lines =
    existing
      .replace(
        /\r\n/g,
        "\n",
      )
      .split("\n");

  for (
    const [
      key,
      rawValue,
    ] of Object.entries(
      entries,
    )
  ) {
    const value =
      assertEnvValue(
        rawValue,
        key,
      );

    const prefix =
      `${key}=`;

    const matching = [];

    for (
      let index = 0;
      index < lines.length;
      index += 1
    ) {
      if (
        lines[index].startsWith(
          prefix,
        )
      ) {
        matching.push(index);
      }
    }

    const nextLine =
      `${key}=${value}`;

    if (matching.length === 0) {
      lines.push(nextLine);
    } else {
      lines[matching[0]] =
        nextLine;

      for (
        let index =
          matching.length - 1;
        index >= 1;
        index -= 1
      ) {
        lines.splice(
          matching[index],
          1,
        );
      }
    }
  }

  while (
    lines.length > 0 &&
    lines[
      lines.length - 1
    ] === ""
  ) {
    lines.pop();
  }

  writeFileSync(
    envPath,
    `${lines.join(eol)}${eol}`,
    "utf8",
  );
}

async function main() {
  const credentialsArg =
    process.argv[2];

  if (!credentialsArg) {
    fail(
      "Gunakan: node scripts/bootstrap-google-drive-oauth.mjs <path-ke-OAuth-client-JSON>",
    );
  }

  const credentialsPath =
    resolve(
      process.cwd(),
      credentialsArg,
    );

  if (!existsSync(credentialsPath)) {
    fail(
      `File OAuth client tidak ditemukan: ${credentialsPath}`,
    );
  }

  const {
    clientId,
    clientSecret,
  } =
    readDesktopClient(
      credentialsPath,
    );

  const state =
    randomBytes(24)
      .toString("hex");

  const callback =
    await startCallbackServer(
      state,
    );

  const oauthClient =
    new OAuth2Client(
      clientId,
      clientSecret,
      callback.redirectUri,
    );

  const authorizationUrl =
    oauthClient.generateAuthUrl({
      access_type:
        "offline",
      prompt:
        "consent",
      scope:
        [DRIVE_SCOPE],
      state,
    });

  console.log(
    "\nBuka URL OAuth berikut di profil browser yang menggunakan akun Google test user:",
  );
  console.log(
    authorizationUrl,
  );
  console.log(
    "\nBiarkan terminal ini tetap terbuka sampai proses otorisasi selesai.",
  );

  let code;

  try {
    code =
      await callback.codePromise;
  } finally {
    callback.close();
  }

  const {
    tokens,
  } =
    await oauthClient.getToken(
      code,
    );

  const refreshToken =
    requireText(
      tokens.refresh_token,
      "OAuth refresh token",
    );

  oauthClient.setCredentials(
    tokens,
  );

  console.log(
    "OAuth berhasil. Menyiapkan folder Google Drive...",
  );

  const rootFolderId =
    await ensureFolder(
      oauthClient,
      ROOT_FOLDER_NAME,
      "root",
    );

  const childFolderIds = {};

  for (
    const child of CHILD_FOLDERS
  ) {
    childFolderIds[
      child.envKey
    ] =
      await ensureFolder(
        oauthClient,
        child.name,
        rootFolderId,
      );
  }

  updateEnvLocal({
    GOOGLE_DRIVE_CLIENT_ID:
      clientId,
    GOOGLE_DRIVE_CLIENT_SECRET:
      clientSecret,
    GOOGLE_DRIVE_REFRESH_TOKEN:
      refreshToken,
    GOOGLE_DRIVE_ROOT_FOLDER_ID:
      rootFolderId,
    ...childFolderIds,
  });

  console.log(
    "\nPASS: OAuth Google Drive dan bootstrap folder berhasil.",
  );
  console.log(
    "Folder root : Ruang Sejahtera Private Media",
  );
  console.log(
    "Subfolder   : donasi",
  );
  console.log(
    "Subfolder   : pengajuan",
  );
  console.log(
    "Credential dan folder ID telah disimpan ke .env.local tanpa mencetak nilainya.",
  );
  console.log(
    "Tidak ada media produksi yang dipindahkan dan provider runtime belum diubah.",
  );
}

main().catch(
  (error) => {
    console.error(
      "\nBootstrap Google Drive gagal:",
      error instanceof Error
        ? error.message
        : error,
    );
    process.exitCode = 1;
  },
);
