import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";

export const SITE_NAME = "Yayasan Ruang Sejahtera";
export const SITE_NAME_SHORT = "Ruang Sejahtera";
export const SITE_DESCRIPTION =
  "Yayasan Ruang Sejahtera menjalankan program sosial di Sampang melalui bantuan pangan, pendidikan, kesehatan, renovasi rumah, dan air bersih.";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string | null;
  absoluteTitle?: boolean;
  article?: {
    publishedTime?: Date | null;
    modifiedTime?: Date | null;
    authors?: string[];
  };
};

function removeBrandSuffix(title: string) {
  return title
    .trim()
    .replace(/\s*\|\s*(?:Yayasan\s+)?Ruang\s+Sejahtera\s*$/i, "")
    .trim();
}

export function createSeoDescription(
  candidates: Array<string | null | undefined>,
  fallback = SITE_DESCRIPTION,
) {
  const source =
    candidates.find((candidate) => candidate?.trim()) ?? fallback;

  const normalized = sanitizeHtml(source, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= 160) {
    return normalized;
  }

  const shortened = normalized.slice(0, 157);
  const lastSpace = shortened.lastIndexOf(" ");

  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : 157).trim()}…`;
}

export function createPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  absoluteTitle = false,
  article,
}: PageMetadataOptions): Metadata {
  const cleanTitle = removeBrandSuffix(title) || SITE_NAME_SHORT;
  const resolvedTitle = absoluteTitle
    ? title.trim()
    : cleanTitle;
  const socialTitle = absoluteTitle
    ? resolvedTitle
    : `${cleanTitle} | ${SITE_NAME_SHORT}`;
  const resolvedDescription = createSeoDescription([description]);
  const images = image
    ? [
        {
          url: image,
          alt: imageAlt?.trim() || cleanTitle,
        },
      ]
    : undefined;

  const openGraph: Metadata["openGraph"] = article
    ? {
        title: socialTitle,
        description: resolvedDescription,
        type: "article",
        url: path,
        siteName: SITE_NAME,
        locale: "id_ID",
        publishedTime: article.publishedTime?.toISOString(),
        modifiedTime: article.modifiedTime?.toISOString(),
        authors: article.authors,
        images,
      }
    : {
        title: socialTitle,
        description: resolvedDescription,
        type: "website",
        url: path,
        siteName: SITE_NAME,
        locale: "id_ID",
        images,
      };

  return {
    title: absoluteTitle
      ? { absolute: resolvedTitle }
      : resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: path,
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: resolvedDescription,
      images: image ? [image] : undefined,
    },
  };
}
