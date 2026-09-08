import sanitizeHtml from "sanitize-html";

const ALIGN_CLASSES = [
  "ql-align-center",
  "ql-align-right",
  "ql-align-justify",
];

function normalizeArticleWhitespace(value: string) {
  return value
    // HTML entities for non-breaking spaces.
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&#x0*a0;/gi, " ")
    // Unicode non-breaking spaces commonly introduced by pasted documents.
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    // Remove zero-width spaces that can interfere with natural wrapping.
    .replace(/\u200B/g, "");
}

export function sanitizeArticleHtml(value: string) {
  const normalized = normalizeArticleWhitespace(value);

  const sanitized = sanitizeHtml(normalized, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "iframe",
      "figure",
      "figcaption",
    ]),

    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,

      a: [
        "href",
        "name",
        "target",
        "rel",
      ],

      img: [
        "src",
        "alt",
        "title",
        "width",
        "height",
        "loading",
      ],

      iframe: [
        "src",
        "title",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "frameborder",
        "class",
      ],

      p: ["class"],
      h1: ["class"],
      h2: ["class"],
      h3: ["class"],
      blockquote: ["class"],
      figure: ["class"],
      figcaption: ["class"],
    },

    allowedClasses: {
      p: ALIGN_CLASSES,
      h1: ALIGN_CLASSES,
      h2: ALIGN_CLASSES,
      h3: ALIGN_CLASSES,
      blockquote: ALIGN_CLASSES,
      iframe: ["ql-video"],
      figure: ["article-media"],
      figcaption: ["article-caption"],
    },

    allowedSchemes: [
      "http",
      "https",
      "mailto",
      "tel",
    ],

    allowedSchemesAppliedToAttributes: [
      "href",
      "src",
    ],

    allowProtocolRelative: false,

    allowedIframeHostnames: [
      "youtube.com",
      "www.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
    ],
  });

  return normalizeArticleWhitespace(sanitized);
}

export function hasMeaningfulArticleContent(value: string) {
  const sanitized = sanitizeArticleHtml(value);

  const text = sanitizeHtml(sanitized, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  const hasMedia = /<(img|iframe)\b/i.test(sanitized);

  return {
    sanitized,
    meaningful: text.length > 0 || hasMedia,
  };
}
