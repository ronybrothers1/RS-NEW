import {
  spawn,
} from "node:child_process";
import {
  cpSync,
  existsSync,
} from "node:fs";
import {
  join,
} from "node:path";

const root =
  process.cwd();

const port =
  3197;

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms,
      ),
  );
}

async function request(
  pathname,
  options = {},
) {
  return fetch(
    `http://127.0.0.1:${port}${pathname}`,
    {
      redirect: "manual",
      ...options,
    },
  );
}

async function waitForServer(
  child,
  output,
) {
  const started =
    Date.now();

  while (
    Date.now() -
      started <
    60_000
  ) {
    if (
      child.exitCode !==
      null
    ) {
      throw new Error(
        `Server berhenti sebelum siap.\n${output.join(
          "",
        )}`,
      );
    }

    try {
      const response =
        await request("/");

      if (
        response.status >=
          200 &&
        response.status <
          500
      ) {
        return;
      }
    } catch {
      // Server belum siap.
    }

    await sleep(500);
  }

  throw new Error(
    "Standalone server tidak siap dalam 60 detik.",
  );
}

function expectStatus(
  label,
  actual,
  expected,
) {
  const allowed =
    Array.isArray(
      expected,
    )
      ? expected
      : [expected];

  if (
    !allowed.includes(
      actual,
    )
  ) {
    throw new Error(
      `${label}: status ${actual}, seharusnya ${allowed.join(
        "/",
      )}.`,
    );
  }

  console.log(
    `[PASS] ${label}: ${actual}`,
  );
}

async function main() {
  const standalone =
    join(
      root,
      ".next",
      "standalone",
    );

  const serverFile =
    join(
      standalone,
      "server.js",
    );

  if (
    !existsSync(
      serverFile,
    )
  ) {
    throw new Error(
      "Standalone build belum tersedia. Jalankan npm run build terlebih dahulu.",
    );
  }

  const staticSource =
    join(
      root,
      ".next",
      "static",
    );

  const staticTarget =
    join(
      standalone,
      ".next",
      "static",
    );

  if (
    existsSync(
      staticSource,
    )
  ) {
    cpSync(
      staticSource,
      staticTarget,
      {
        recursive: true,
        force: true,
      },
    );
  }

  const publicSource =
    join(
      root,
      "public",
    );

  const publicTarget =
    join(
      standalone,
      "public",
    );

  if (
    existsSync(
      publicSource,
    )
  ) {
    cpSync(
      publicSource,
      publicTarget,
      {
        recursive: true,
        force: true,
      },
    );
  }

  const args = [];

  if (
    existsSync(
      join(
        root,
        ".env.local",
      ),
    )
  ) {
    args.push(
      "--env-file=.env.local",
    );
  }

  args.push(
    ".next/standalone/server.js",
  );

  const child =
    spawn(
      process.execPath,
      args,
      {
        cwd: root,
        env: {
          ...process.env,
          PORT:
            String(port),
          HOSTNAME:
            "127.0.0.1",
        },
        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
      },
    );

  const output = [];

  child.stdout.on(
    "data",
    (chunk) => {
      output.push(
        chunk.toString(),
      );
    },
  );

  child.stderr.on(
    "data",
    (chunk) => {
      output.push(
        chunk.toString(),
      );
    },
  );

  try {
    await waitForServer(
      child,
      output,
    );

    console.log(
      "\n============================================",
    );
    console.log(
      "QA HTTP FASE 7",
    );
    console.log(
      "============================================",
    );

    for (
      const pathname of
      [
        "/",
        "/login",
        "/register",
        "/bantuan",
        "/donasi",
      ]
    ) {
      const response =
        await request(
          pathname,
        );

      expectStatus(
        `GET ${pathname}`,
        response.status,
        200,
      );
    }

    for (
      const pathname of
      [
        "/akun",
        "/admin/dashboard",
      ]
    ) {
      const response =
        await request(
          pathname,
        );

      expectStatus(
        `Guest protected ${pathname}`,
        response.status,
        [
          302,
          303,
          307,
          308,
        ],
      );
    }

    {
      const response =
        await request(
          "/api/akun/pengajuan/media/00000000-0000-4000-8000-000000000000",
        );

      expectStatus(
        "Private assistance media without session",
        response.status,
        401,
      );
    }

    {
      const response =
        await request(
          "/api/admin/media/upload",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify(
                {},
              ),
          },
        );

      expectStatus(
        "Admin upload without staff session",
        response.status,
        403,
      );
    }

    {
      const response =
        await request(
          "/api/bantuan/phase7-not-found/cover",
        );

      expectStatus(
        "Unknown campaign cover",
        response.status,
        404,
      );
    }

    console.log(
      "STATUS: PASS",
    );
  } finally {
    child.kill();

    await Promise.race([
      new Promise(
        (resolve) => {
          child.once(
            "exit",
            resolve,
          );
        },
      ),
      sleep(3000),
    ]);
  }
}

main().catch(
  (error) => {
    console.error(
      "HTTP smoke test gagal:",
      error,
    );
    process.exitCode = 1;
  },
);
