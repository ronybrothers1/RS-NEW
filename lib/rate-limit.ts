type RateLimitRecord = {
  count: number;
  lastReset: number;
  expiresAt: number;
};

const store =
  new Map<
    string,
    RateLimitRecord
  >();

const MAX_RECORDS = 5000;

function pruneStore(
  now: number,
) {
  for (
    const [
      key,
      record,
    ] of store
  ) {
    if (
      record.expiresAt <= now
    ) {
      store.delete(key);
    }
  }

  if (
    store.size <=
    MAX_RECORDS
  ) {
    return;
  }

  const overflow =
    store.size -
    MAX_RECORDS;

  let removed = 0;

  for (
    const key of
    store.keys()
  ) {
    store.delete(key);
    removed += 1;

    if (
      removed >= overflow
    ) {
      break;
    }
  }
}

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): {
  success: boolean;
  retryAfterMs: number;
} {
  const now =
    Date.now();

  if (
    store.size >
      MAX_RECORDS ||
    Math.random() < 0.02
  ) {
    pruneStore(now);
  }

  const record =
    store.get(
      identifier,
    );

  if (
    !record ||
    record.expiresAt <=
      now
  ) {
    store.set(
      identifier,
      {
        count: 1,
        lastReset: now,
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
