import dotenv from "dotenv";
import {
  existsSync,
  readFileSync,
} from "node:fs";

dotenv.config({
  path: ".env.local",
});
dotenv.config();

const results = [];

function add(
  level,
  label,
  detail,
) {
  results.push({
    level,
    label,
    detail,
  });

  console.log(
    `[${level}] ${label}: ${detail}`,
  );
}

function present(
  name,
) {
  return Boolean(
    process.env[
      name
    ]?.trim(),
  );
}

function sourceHas(
  path,
  pattern,
) {
  if (
    !existsSync(path)
  ) {
    return false;
  }

  return readFileSync(
    path,
    "utf8",
  ).includes(
    pattern,
  );
}

if (
  present(
    "AUTH_SECRET",
  )
) {
  const length =
    process.env
      .AUTH_SECRET
      .trim()
      .length;

  add(
    length >= 32
      ? "PASS"
      : "WARN",
    "AUTH_SECRET",
    length >= 32
      ? "tersedia dan panjang memadai"
      : "tersedia tetapi sebaiknya minimal 32 karakter",
  );
} else {
  add(
    "FAIL",
    "AUTH_SECRET",
    "belum tersedia",
  );
}

if (
  present(
    "DATABASE_URL",
  ) ||
  present(
    "SQL_HOST",
  )
) {
  add(
    "PASS",
    "Database",
    "konfigurasi koneksi tersedia",
  );
} else {
  add(
    "FAIL",
    "Database",
    "DATABASE_URL/SQL_HOST belum tersedia",
  );
}

if (
  present(
    "ASSISTANCE_READ_WRITE_TOKEN",
  )
) {
  add(
    "PASS",
    "Private Blob",
    "token private media tersedia",
  );
} else {
  add(
    "FAIL",
    "Private Blob",
    "ASSISTANCE_READ_WRITE_TOKEN belum tersedia",
  );
}

if (
  present(
    "RESEND_API_KEY",
  )
) {
  add(
    "PASS",
    "Resend",
    "API key tersedia",
  );
} else {
  add(
    "WARN",
    "Resend",
    "RESEND_API_KEY belum tersedia",
  );
}

const emailFrom =
  process.env
    .EMAIL_FROM
    ?.trim() ||
  "";

if (emailFrom) {
  add(
    /@resend\.dev/i.test(
      emailFrom,
    )
      ? "WARN"
      : "PASS",
    "EMAIL_FROM",
    /@resend\.dev/i.test(
      emailFrom,
    )
      ? "masih memakai domain development Resend"
      : "sender produksi telah dikonfigurasi",
  );
} else {
  add(
    "WARN",
    "EMAIL_FROM",
    "belum tersedia",
  );
}

const siteUrl =
  process.env
    .NEXT_PUBLIC_SITE_URL
    ?.trim() ||
  "";

if (!siteUrl) {
  add(
    "WARN",
    "Canonical URL",
    "NEXT_PUBLIC_SITE_URL kosong; Vercel fallback masih bekerja tetapi wajib dikunci saat domain utama diluncurkan",
  );
} else if (
  /^https:\/\//i.test(
    siteUrl,
  ) &&
  !/localhost/i.test(
    siteUrl,
  )
) {
  add(
    "PASS",
    "Canonical URL",
    "menggunakan HTTPS non-localhost",
  );
} else {
  add(
    "WARN",
    "Canonical URL",
    "nilai belum tampak seperti URL produksi HTTPS",
  );
}

const databaseUrl =
  process.env
    .DATABASE_URL
    ?.trim() ||
  "";

if (
  databaseUrl
) {
  const match =
    databaseUrl.match(
      /[?&]sslmode=([^&]+)/i,
    );

  add(
    match?.[1]
      ?.toLowerCase() ===
      "verify-full"
      ? "PASS"
      : "WARN",
    "PostgreSQL SSL",
    match
      ? `sslmode=${match[1]}; runtime menormalisasi alias ke verify-full, tetapi env sebaiknya ditulis eksplisit`
      : "sslmode tidak tertulis pada DATABASE_URL",
  );
}

add(
  sourceHas(
    "middleware.ts",
    'runtime: "nodejs"',
  )
    ? "PASS"
    : "FAIL",
  "Auth middleware runtime",
  sourceHas(
    "middleware.ts",
    'runtime: "nodejs"',
  )
    ? "Node.js runtime aktif"
    : "Node.js runtime belum aktif",
);

add(
  sourceHas(
    "app/(public)/donasi/components/DonationProofUploader.tsx",
    'access:\n              "private"',
  ) ||
  sourceHas(
    "app/(public)/donasi/components/DonationProofUploader.tsx",
    'access: "private"',
  )
    ? "PASS"
    : "FAIL",
  "Donation proof privacy",
  "uploader harus menggunakan private Blob",
);

add(
  existsSync(
    "app/api/health/route.ts",
  )
    ? "PASS"
    : "FAIL",
  "Health endpoint",
  existsSync(
    "app/api/health/route.ts",
  )
    ? "/api/health tersedia"
    : "/api/health belum tersedia",
);

const failCount =
  results.filter(
    (item) =>
      item.level ===
      "FAIL",
  ).length;

const warnCount =
  results.filter(
    (item) =>
      item.level ===
      "WARN",
  ).length;

console.log(
  "\n============================================",
);
console.log(
  "LAUNCH READINESS SUMMARY",
);
console.log(
  "============================================",
);
console.log(
  `FAIL: ${failCount}`,
);
console.log(
  `WARN: ${warnCount}`,
);

if (
  failCount >
  0
) {
  process.exitCode =
    1;
}
