const stripTrailingSlash = (value: string) => value.trim().replace(/\/+$/, '');

const withProtocol = (value: string) => {
  const normalized = stripTrailingSlash(value);
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  return `https://${normalized}`;
};

export function getSiteUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicitUrl?.trim()) {
    return withProtocol(explicitUrl);
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (vercelUrl?.trim()) {
    return withProtocol(vercelUrl);
  }

  return 'http://localhost:3000';
}
