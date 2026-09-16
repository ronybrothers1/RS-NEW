import {
  createHash,
  createHmac,
} from "node:crypto";

import {
  createPool,
} from "@/src/db";

type RateLimitRecord = {
  count: number;
  expiresAt: number;
};

type RateLimitResult = {
  success: boolean;
  retryAfterMs: number;
};

type DatabaseRateLimitRow = {
  count: number;
  retry_after_ms:
    | string
    | number;
};

const fallbackStore =
  new Map<
    string,
    RateLimitRecord
  >();

const MAX_FALLBACK_RECORDS =
  5000;

const DATABASE_ERROR_LOG_INTERVAL_MS =
  60_000;

let lastDatabaseErrorLogAt =
  0;

function hashIdentifier(
  identifier: string,
) {
  const environment =
    process.env.VERCEL_ENV
      ?.trim() ||
    process.env.NODE_ENV
      ?.trim() ||
    "local";

  const value =
    `rate-limit:v1:${environment}:${identifier}`;

  const secret =
    process.env.AUTH_SECRET
      ?.trim();

  if (secret) {
    return createHmac(
      "sha256",
      secret,
    )
      .update(value)
      .digest("hex");
  }

  /*
   * AUTH_SECRET wajib tersedia di production.
   * SHA-256 ini hanya menjadi fallback aman
   * untuk environment lokal/build yang belum
   * memiliki secret.
   */
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function pruneFallbackStore(
  now: number,
) {
  for (
    const [
      key,
      record,
    ] of fallbackStore
  ) {
    if (
      record.expiresAt <= now
    ) {
      fallbackStore.delete(
        key,
      );
    }
  }

  if (
    fallbackStore.size <=
    MAX_FALLBACK_RECORDS
  ) {
    return;
  }

  const overflow =
    fallbackStore.size -
    MAX_FALLBACK_RECORDS;

  let removed = 0;

  for (
    const key of
    fallbackStore.keys()
  ) {
    fallbackStore.delete(
      key,
    );

    removed += 1;

    if (
      removed >= overflow
    ) {
      break;
    }
  }
}

function fallbackRateLimit(
  keyHash: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now =
    Date.now();

  if (
    fallbackStore.size >
      MAX_FALLBACK_RECORDS ||
    Math.random() < 0.02
  ) {
    pruneFallbackStore(
      now,
    );
  }

  const record =
    fallbackStore.get(
      keyHash,
    );

  if (
    !record ||
    record.expiresAt <=
      now
  ) {
    fallbackStore.set(
      keyHash,
      {
        count: 1,
        expiresAt:
          now + windowMs,
      },
    );

    return {
      success: true,
      retryAfterMs: 0,
    };
  }

  if (
    record.count >=
    limit
  ) {
    return {
      success: false,
      retryAfterMs:
        Math.max(
          0,
          record.expiresAt -
            now,
        ),
    };
  }

  record.count += 1;

  return {
    success: true,
    retryAfterMs: 0,
  };
}

function logDatabaseFallback(
  error: unknown,
) {
  const now =
    Date.now();

  if (
    now -
      lastDatabaseErrorLogAt <
    DATABASE_ERROR_LOG_INTERVAL_MS
  ) {
    return;
  }

  lastDatabaseErrorLogAt =
    now;

  console.error(
    "Shared rate limiter unavailable; using process-local fallback:",
    error instanceof Error
      ? error.message
      : "Unknown database error",
  );
}

async function databaseRateLimit(
  keyHash: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const pool =
    createPool();

  const result =
    await pool.query<DatabaseRateLimitRow>(
      `
        INSERT INTO rate_limit_buckets (
          key_hash,
          count,
          expires_at,
          updated_at
        )
        VALUES (
          $1,
          1,
          NOW() + (
            $2::bigint *
            INTERVAL '1 millisecond'
          ),
          NOW()
        )
        ON CONFLICT (key_hash)
        DO UPDATE SET
          count =
            CASE
              WHEN rate_limit_buckets.expires_at <= NOW()
                THEN 1
              ELSE LEAST(
                rate_limit_buckets.count + 1,
                $3::integer + 1
              )
            END,
          expires_at =
            CASE
              WHEN rate_limit_buckets.expires_at <= NOW()
                THEN NOW() + (
                  $2::bigint *
                  INTERVAL '1 millisecond'
                )
              ELSE rate_limit_buckets.expires_at
            END,
          updated_at = NOW()
        RETURNING
          count,
          GREATEST(
            0,
            CEIL(
              EXTRACT(
                EPOCH FROM (
                  expires_at - NOW()
                )
              ) * 1000
            )
          )::bigint AS retry_after_ms
      `,
      [
        keyHash,
        windowMs,
        limit,
      ],
    );

  const row =
    result.rows[0];

  if (!row) {
    throw new Error(
      "Shared rate limiter tidak mengembalikan hasil.",
    );
  }

  const retryAfterMs =
    Math.max(
      0,
      Number(
        row.retry_after_ms,
      ) || 0,
    );

  return {
    success:
      row.count <= limit,

    retryAfterMs:
      row.count <= limit
        ? 0
        : retryAfterMs,
  };
}

async function maybePruneDatabaseBuckets() {
  if (
    Math.random() >= 0.01
  ) {
    return;
  }

  try {
    const pool =
      createPool();

    await pool.query(
      `
        DELETE FROM rate_limit_buckets
        WHERE expires_at <
          NOW() - INTERVAL '1 hour'
      `,
    );
  } catch {
    /*
     * Cleanup bersifat best-effort.
     * Kegagalannya tidak boleh mengganggu request.
     */
  }
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (
    !identifier ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isFinite(
      windowMs,
    ) ||
    windowMs <= 0
  ) {
    throw new Error(
      "Konfigurasi rate limiter tidak valid.",
    );
  }

  const normalizedWindowMs =
    Math.trunc(
      windowMs,
    );

  const keyHash =
    hashIdentifier(
      identifier,
    );

  try {
    const result =
      await databaseRateLimit(
        keyHash,
        limit,
        normalizedWindowMs,
      );

    await maybePruneDatabaseBuckets();

    return result;
  } catch (error) {
    logDatabaseFallback(
      error,
    );

    return fallbackRateLimit(
      keyHash,
      limit,
      normalizedWindowMs,
    );
  }
}