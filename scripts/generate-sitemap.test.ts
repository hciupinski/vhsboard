import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { escapeXml, generateSitemap } from "./generate-sitemap";

const directories: string[] = [];

const createOutputDirectory = async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "vhsboard-sitemap-"));
  directories.push(outputDirectory);
  const paths = [
    "/",
    "/o-nas",
    "/wyjazdy",
    "/eventy",
    "/polkolonie",
    "/kontakt",
    "/wyjazdy/atlantic-surf-week",
    "/polkolonie/wakeboardowe-lato",
  ];
  for (const path of paths) {
    const filename =
      path === "/"
        ? join(outputDirectory, "index.html")
        : join(outputDirectory, path, "index.html");
    await mkdir(join(filename, ".."), { recursive: true });
    await writeFile(filename, '<html lang="pl"></html>');
  }
  return outputDirectory;
};

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("generateSitemap", () => {
  it("writes only canonical URLs whose static artifacts exist", async () => {
    const outputDirectory = await createOutputDirectory();

    await generateSitemap({
      outputDirectory,
      siteUrl: "https://vhsboard.pages.dev",
      offerRecords: [
        { slug: "atlantic-surf-week", updatedAt: "2026-01-02T10:30:00.000Z", offerKind: "trip" },
        {
          slug: "wakeboardowe-lato",
          updatedAt: "2026-01-03T10:30:00.000Z",
          offerKind: "day_camp",
        },
      ],
    });

    const sitemap = await readFile(join(outputDirectory, "sitemap.xml"), "utf8");
    const robots = await readFile(join(outputDirectory, "robots.txt"), "utf8");
    expect(sitemap).toContain("https://vhsboard.pages.dev/wyjazdy/atlantic-surf-week");
    expect(sitemap).toContain("https://vhsboard.pages.dev/polkolonie/wakeboardowe-lato");
    expect(sitemap).toContain("2026-01-02T10:30:00.000Z");
    expect(sitemap).not.toContain("/admin");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Sitemap: https://vhsboard.pages.dev/sitemap.xml");
  });

  it("rejects a missing output artifact or non-HTTPS origin", async () => {
    const outputDirectory = await createOutputDirectory();

    await expect(
      generateSitemap({
        outputDirectory,
        siteUrl: "https://vhsboard.pages.dev",
        offerRecords: [
          { slug: "missing-trip", updatedAt: "2026-01-02T10:30:00.000Z", offerKind: "trip" },
        ],
      }),
    ).rejects.toThrow(/brakuje/i);
    await expect(
      generateSitemap({ outputDirectory, siteUrl: "http://vhsboard.pages.dev", offerRecords: [] }),
    ).rejects.toThrow("originem HTTPS");
  });

  it("escapes XML text", () => {
    expect(escapeXml("<tag>&\"'")).toBe("&lt;tag&gt;&amp;&quot;&apos;");
  });
});
