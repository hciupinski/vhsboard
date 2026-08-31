import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { escapeXml, generateSitemap } from "./generate-sitemap";

const directories: string[] = [];

const createOutputDirectory = async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "vhsboard-sitemap-"));
  directories.push(outputDirectory);
  const paths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/obozy", "/kontakt"];
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
  it("writes only canonical URLs for static marketing pages", async () => {
    const outputDirectory = await createOutputDirectory();

    await generateSitemap({
      outputDirectory,
      siteUrl: "https://vhsboard.pages.dev",
    });

    const sitemap = await readFile(join(outputDirectory, "sitemap.xml"), "utf8");
    const robots = await readFile(join(outputDirectory, "robots.txt"), "utf8");
    expect(sitemap).toContain("https://vhsboard.pages.dev/obozy");
    expect(sitemap).not.toContain("/wyjazdy/atlantic-surf-week");
    expect(sitemap).not.toContain("/admin");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Sitemap: https://vhsboard.pages.dev/sitemap.xml");
  });

  it("rejects a non-HTTPS origin", async () => {
    const outputDirectory = await createOutputDirectory();

    await expect(
      generateSitemap({ outputDirectory, siteUrl: "http://vhsboard.pages.dev" }),
    ).rejects.toThrow("originem HTTPS");
  });

  it("escapes XML text", () => {
    expect(escapeXml("<tag>&\"'")).toBe("&lt;tag&gt;&amp;&quot;&apos;");
  });
});
