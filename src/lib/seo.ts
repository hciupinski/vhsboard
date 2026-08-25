import { getSeoConfig } from "./env";

export { getSeoConfig } from "./env";

type PageMetadataInput = {
  path: string;
  title: string;
  description: string;
  indexable?: boolean;
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
}: PageMetadataInput) => {
  const canonical = canonicalUrl(path);
  const robots = getSeoConfig().indexing && indexable ? "index, follow" : "noindex, nofollow";

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
