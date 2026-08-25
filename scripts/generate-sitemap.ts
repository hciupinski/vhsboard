import { access, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig, getSeoConfigFrom } from "../src/lib/env";
import { publishedOfferSeoRowSchema } from "../src/lib/offers/schema";
import type { PublishedOfferSeoRecord } from "../src/lib/offers/types";

const staticPaths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/polkolonie", "/kontakt"];

export const escapeXml = (value: string): string =>
  value.replace(/[<>&"']/g, (character) => {
    const escaped: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return escaped[character]!;
  });

const validateHttpsOrigin = (siteUrl: string): string => {
  const config = getSeoConfigFrom({ VITE_SITE_URL: siteUrl, VITE_SEO_INDEXING: "false" });
  return config.siteUrl;
};

const outputFileForPath = (outputDirectory: string, path: string): string =>
  path === "/" ? join(outputDirectory, "index.html") : join(outputDirectory, path, "index.html");

const ensureOutputExists = async (outputDirectory: string, path: string): Promise<void> => {
  try {
    await access(outputFileForPath(outputDirectory, path));
  } catch {
    throw new Error(`Brakuje statycznego pliku dla ścieżki ${path}.`);
  }
};

const toCanonicalUrl = (siteUrl: string, path: string): string => `${siteUrl}${path}`;

type GenerateSitemapInput = {
  outputDirectory: string;
  siteUrl: string;
  offerRecords: PublishedOfferSeoRecord[];
};

export const generateSitemap = async ({
  outputDirectory,
  siteUrl,
  offerRecords,
}: GenerateSitemapInput): Promise<void> => {
  const origin = validateHttpsOrigin(siteUrl);
  const paths = [...staticPaths, ...offerRecords.map(({ slug }) => `/wyjazdy/${slug}`)];

  await Promise.all(paths.map((path) => ensureOutputExists(outputDirectory, path)));

  const urls = [
    ...staticPaths.map((path) => ({ loc: toCanonicalUrl(origin, path), lastmod: undefined })),
    ...offerRecords.map(({ slug, updatedAt }) => ({
      loc: toCanonicalUrl(origin, `/wyjazdy/${slug}`),
      lastmod: updatedAt,
    })),
  ];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      ({ loc, lastmod }) =>
        `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}</url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");
  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");

  await Promise.all([
    writeFile(join(outputDirectory, "sitemap.xml"), sitemap, "utf8"),
    writeFile(join(outputDirectory, "robots.txt"), robots, "utf8"),
  ]);
};

const main = async () => {
  const { url, anonKey } = getPublicSupabaseConfig();
  const { siteUrl } = getSeoConfigFrom(import.meta.env);
  const { data, error } = await createClient(url, anonKey)
    .from("offers")
    .select("slug,updated_at")
    .eq("status", "published");

  if (error || !Array.isArray(data)) {
    throw new Error("Nie udało się pobrać opublikowanych ofert do mapy strony.", { cause: error });
  }

  const offerRecords = data.map((row) => {
    const parsed = publishedOfferSeoRowSchema.parse(row);
    return { slug: parsed.slug, updatedAt: parsed.updated_at };
  });

  await generateSitemap({ outputDirectory: ".output/public", siteUrl, offerRecords });
};

if (import.meta.main) {
  await main();
}
