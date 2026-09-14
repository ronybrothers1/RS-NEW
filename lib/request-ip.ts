type HeaderReader = {
  get(
    name: string,
  ): string | null;
};

export function getClientIp(
  headersList: HeaderReader,
) {
  const forwardedFor =
    headersList.get(
      "x-forwarded-for",
    );

  return (
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    headersList.get(
      "x-real-ip",
    ) ||
    "unknown-ip"
  );
}
