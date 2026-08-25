import { access, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { getSeoConfigFrom } from "../src/lib/env";

const staticPaths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/polkolonie", "/kontakt"];
const signedUrlPattern = /(?:[?&]token=|x-amz-|\/object\/sign\/)/i;
const offerDetailOutputPattern = /^(?:wyjazdy|polkolonie)\/[^/]+\/index\.html$/;

type CheckSeoBuildInput = {
  outputDirectory: string;
  siteUrl: string;
  indexing: boolean;
};

const outputFileForPath = (outputDirectory: string, path: string): string =>
  path === "/" ? join(outputDirectory, "index.html") : join(outputDirectory, path, "index.html");

const ensureFile = async (filename: string, description: string): Promise<void> => {
  try {
    await access(filename);
  } catch {
    throw new Error(`Brakuje ${description}: ${filename}`);
  }
};

const extractSingle = (html: string, pattern: RegExp, label: string, path: string): string => {
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1 || !matches[0]?.[1]?.trim()) {
    throw new Error(`${path}: oczekiwano dokładnie jednego ${label}.`);
  }

  return matches[0][1].trim();
};

const extractCanonical = (html: string, path: string): string => {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  const canonicals = tags
    .filter((tag) => /\brel=["']canonical["']/i.test(tag))
    .map((tag) => tag.match(/\bhref=["']([^"']+)["']/i)?.[1])
    .filter((value): value is string => Boolean(value));

  if (canonicals.length !== 1) {
    throw new Error(`${path}: oczekiwano dokładnie jednego canonical.`);
  }

  return canonicals[0]!;
};

const listOutputFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const filename = join(directory, entry.name);
      return entry.isDirectory() ? listOutputFiles(filename) : [filename];
    }),
  );
  return nested.flat();
};

const expectedCanonical = (siteUrl: string, path: string): string => `${siteUrl}${path}`;

export const checkSeoBuild = async ({
  outputDirectory,
  siteUrl,
  indexing,
}: CheckSeoBuildInput): Promise<void> => {
  const { siteUrl: origin } = getSeoConfigFrom({
    VITE_SITE_URL: siteUrl,
    VITE_SEO_INDEXING: indexing ? "true" : "false",
  });
  const expectedRobots = indexing ? "index, follow" : "noindex, nofollow";
  const paths = staticPaths;
  const outputFiles = await listOutputFiles(outputDirectory);

  if (
    outputFiles.some((filename) => relative(outputDirectory, filename).split("/").includes("admin"))
  ) {
    throw new Error("Artefakt builda nie może zawierać strony /admin.");
  }
  if (
    outputFiles.some((filename) =>
      offerDetailOutputPattern.test(relative(outputDirectory, filename)),
    )
  ) {
    throw new Error("Artefakt builda nie może zawierać statycznych szczegółów ofert.");
  }

  for (const path of paths) {
    const filename = outputFileForPath(outputDirectory, path);
    await ensureFile(filename, `statycznego pliku dla ${path}`);
    const html = await readFile(filename, "utf8");

    if (!/<html\b[^>]*\blang=["']pl["']/i.test(html)) {
      throw new Error(`${path}: html musi mieć lang=pl.`);
    }
    extractSingle(html, /<title[^>]*>([^<]+)<\/title>/gi, "title", path);
    extractSingle(
      html,
      /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/gi,
      "description",
      path,
    );
    const robots = extractSingle(
      html,
      /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/gi,
      "robots",
      path,
    );
    if (robots !== expectedRobots) {
      throw new Error(`${path}: nieprawidłowa wartość robots.`);
    }
    if (extractCanonical(html, path) !== expectedCanonical(origin, path)) {
      throw new Error(`${path}: canonical nie jest prawidłowym URL-em kanonicznym.`);
    }
    if (signedUrlPattern.test(html)) {
      throw new Error(`${path}: HTML zawiera podpisany URL Storage.`);
    }
  }

  const sitemapPath = join(outputDirectory, "sitemap.xml");
  const robotsPath = join(outputDirectory, "robots.txt");
  const redirectsPath = join(outputDirectory, "_redirects");
  await Promise.all([
    ensureFile(sitemapPath, "sitemapy"),
    ensureFile(robotsPath, "robots.txt"),
    ensureFile(redirectsPath, "przekierowań"),
  ]);
  const [sitemap, robots] = await Promise.all([
    readFile(sitemapPath, "utf8"),
    readFile(robotsPath, "utf8"),
  ]);
  const redirects = await readFile(redirectsPath, "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);

  if (
    sitemapUrls.length !== paths.length ||
    sitemapUrls.some((url) => !paths.includes(url.slice(origin.length)))
  ) {
    throw new Error("Sitemap zawiera niekanoniczny URL albo pomija stronę publiczną.");
  }
  if (sitemapUrls.some((url) => !url.startsWith(origin) || url.includes("/admin"))) {
    throw new Error("Sitemap zawiera niedozwolony URL.");
  }
  if (!robots.includes("Disallow: /admin") || !robots.includes(`Sitemap: ${origin}/sitemap.xml`)) {
    throw new Error("robots.txt nie zawiera wymaganej konfiguracji crawlerów.");
  }
};

if (import.meta.main) {
  const config = getSeoConfigFrom(import.meta.env);
  await checkSeoBuild({
    outputDirectory: ".output/public",
    siteUrl: config.siteUrl,
    indexing: config.indexing,
  });
}
