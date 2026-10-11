import { SOCIAL_IMAGES, type SocialImage } from "./social-images";
import { getSeoConfig } from "./env";

export { getSeoConfig } from "./env";

export const getRobotsContent = (indexable = true): "index, follow" | "noindex, nofollow" =>
  getSeoConfig().indexing && indexable ? "index, follow" : "noindex, nofollow";

type PageMetadataInput = {
  path: string;
  title: string;
  description: string;
  indexable?: boolean;
  socialImage?: SocialImage;
  ogType?: "website" | "article";
};

const hasUnsafePathSegment = (path: string): boolean => {
  if (/%2f|%5c/i.test(path)) {
    return true;
  }

  try {
    return decodeURIComponent(path)
      .split("/")
      .some((segment) => segment === "." || segment === "..");
  } catch {
    return true;
  }
};

export const canonicalUrl = (path: string): string => {
  if (!path.startsWith("/") || path.startsWith("//") || hasUnsafePathSegment(path)) {
    throw new Error("Canonical może wskazywać wyłącznie bezpieczną ścieżkę lokalną.");
  }

  const url = new URL(path, "https://canonical.invalid");
  if (url.origin !== "https://canonical.invalid") {
    throw new Error("Canonical może wskazywać wyłącznie bezpieczną ścieżkę lokalną.");
  }

  return `${getSeoConfig().siteUrl}${url.pathname}`;
};

export const createPageMetadata = ({
  path,
  title,
  description,
  indexable = true,
  ogType = "website",
  socialImage = SOCIAL_IMAGES.offers,
}: PageMetadataInput) => {
  if (!/^\/og\/[a-z-]+\.jpg$/.test(socialImage.path))
    throw new Error("Obraz udostępniania musi być lokalnym plikiem JPEG w /og/.");
  const imageUrl = canonicalUrl(socialImage.path);
  const canonical = canonicalUrl(path);
  const robots = getRobotsContent(indexable);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: robots },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:locale", content: "pl_PL" },
      { property: "og:url", content: canonical },
      { property: "og:type", content: ogType },
      { property: "og:image", content: imageUrl },
      { property: "og:image:width", content: String(socialImage.width) },
      { property: "og:image:height", content: String(socialImage.height) },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:alt", content: socialImage.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
      { name: "twitter:image:alt", content: socialImage.alt },
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
};

const jsonLdEscapes: Record<string, string> = {
  "<": "\\u003C",
  ">": "\\u003E",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export const serializeJsonLd = (value: unknown): string => {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("JSON-LD musi dać się serializować.");
  }

  return serialized.replace(/[<>&\u2028\u2029]/g, (character) => jsonLdEscapes[character]!);
};
