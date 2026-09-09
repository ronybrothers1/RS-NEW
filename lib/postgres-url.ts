const ALIASED_SSL_MODES =
  new Set([
    "prefer",
    "require",
    "verify-ca",
  ]);

export function normalizePostgresSslMode(
  rawUrl: string,
) {
  const value =
    rawUrl.trim();

  if (!value) {
    return value;
  }

  try {
    const url =
      new URL(value);

    const sslMode =
      url.searchParams.get(
        "sslmode",
      );

    if (
      sslMode &&
      ALIASED_SSL_MODES.has(
        sslMode.toLowerCase(),
      )
    ) {
      url.searchParams.set(
        "sslmode",
        "verify-full",
      );
    }

    return url.toString();
  } catch {
    return value.replace(
      /([?&]sslmode=)(prefer|require|verify-ca)(?=(&|$))/i,
      "$1verify-full",
    );
  }
}
