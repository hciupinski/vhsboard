import { access, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig, getSeoConfigFrom } from "../src/lib/env";
import { publishedOfferSeoRowSchema } from "../src/lib/offers/schema";
import type { PublishedOfferSeoRecord } from "../src/lib/offers/types";

const staticPaths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/polkolonie", "/kontakt"];
const signedUrlPattern = /(?:[?&]token=|x-amz-|\/object\/sign\/)/i;

const pathForOffer = ({ slug, offerKind }: PublishedOfferSeoRecord): string =>
  `${offerKind === "day_camp" ? "/polkolonie" : "/wyjazdy"}/${slug}`;

type CheckSeoBuildInput = {
  outputDirectory: string;
  siteUrl: string;
  indexing: boolean;
  offerRecords: PublishedOfferSeoRecord[];
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
  offerRecords,
}: CheckSeoBuildInput): Promise<void> => {
  const { siteUrl: origin } = getSeoConfigFrom({
    VITE_SITE_URL: siteUrl,
    VITE_SEO_INDEXING: indexing ? "true" : "false",
  });
  const expectedRobots = indexing ? "index, follow" : "noindex, nofollow";
  const paths = [...staticPaths, ...offerRecords.map(pathForOffer)];
  const outputFiles = await listOutputFiles(outputDirectory);

  if (
    outputFiles.some((filename) => relative(outputDirectory, filename).split("/").includes("admin"))
  ) {
    throw new Error("Artefakt builda nie może zawierać strony /admin.");
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
    if (
      (path.startsWith("/wyjazdy/") || path.startsWith("/polkolonie/")) &&
      /Ładowanie ofert|aria-label=["']Ładowanie/i.test(html)
    ) {
      throw new Error(`${path}: szczegół oferty zawiera skeleton zamiast treści.`);
    }
  }

  const sitemapPath = join(outputDirectory, "sitemap.xml");
  const robotsPath = join(outputDirectory, "robots.txt");
  await Promise.all([ensureFile(sitemapPath, "sitemapy"), ensureFile(robotsPath, "robots.txt")]);
  const [sitemap, robots] = await Promise.all([
    readFile(sitemapPath, "utf8"),
    readFile(robotsPath, "utf8"),
  ]);
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
  const { url, anonKey } = getPublicSupabaseConfig();
  const { data, error } = await createClient(url, anonKey)
    .from("offers")
    .select("slug,updated_at,offer_kind")
    .eq("status", "published");

  if (error || !Array.isArray(data)) {
    throw new Error("Nie udało się pobrać opublikowanych ofert do kontroli SEO.", {
      cause: error,
    });
  }

  await checkSeoBuild({
    outputDirectory: ".output/public",
    siteUrl: config.siteUrl,
    indexing: config.indexing,
    offerRecords: data.map((row) => {
      const parsed = publishedOfferSeoRowSchema.parse(row);
      return { slug: parsed.slug, updatedAt: parsed.updated_at, offerKind: parsed.offer_kind };
    }),
  });
}
