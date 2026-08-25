import { access, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { getSeoConfigFrom } from "../src/lib/env";

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
};

export const generateSitemap = async ({
  outputDirectory,
  siteUrl,
}: GenerateSitemapInput): Promise<void> => {
  const origin = validateHttpsOrigin(siteUrl);
  await Promise.all(staticPaths.map((path) => ensureOutputExists(outputDirectory, path)));

  const urls = staticPaths.map((path) => ({ loc: toCanonicalUrl(origin, path) }));
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(({ loc }) => `  <url><loc>${escapeXml(loc)}</loc></url>`),
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
  const { siteUrl } = getSeoConfigFrom(import.meta.env);
  await generateSitemap({ outputDirectory: ".output/public", siteUrl });
};

if (import.meta.main) {
  await main();
}
