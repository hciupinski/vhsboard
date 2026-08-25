import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { checkSeoBuild } from "./check-seo-build";

const directories: string[] = [];
const siteUrl = "https://vhsboard.pages.dev";
const staticPaths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/polkolonie", "/kontakt"];
const offerRecords = [{ slug: "atlantic-surf-week", updatedAt: "2026-01-02T10:30:00.000Z" }];

const outputFile = (outputDirectory: string, path: string) =>
  path === "/" ? join(outputDirectory, "index.html") : join(outputDirectory, path, "index.html");

const html = (path: string, body = "Pełna treść strony.") => `<!doctype html>
<html lang="pl"><head>
  <title>Strona ${path}</title>
  <meta name="description" content="Opis strony ${path}.">
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${siteUrl}${path}">
</head><body>${body}</body></html>`;

const createOutput = async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "vhsboard-seo-check-"));
  directories.push(outputDirectory);
  const paths = [...staticPaths, "/wyjazdy/atlantic-surf-week"];
  for (const path of paths) {
    const file = outputFile(outputDirectory, path);
    await mkdir(join(file, ".."), { recursive: true });
    await writeFile(
      file,
      html(path, path.includes("atlantic") ? "Tekst o wyjeździe. Pełna treść oferty." : undefined),
    );
  }
  await writeFile(
    join(outputDirectory, "sitemap.xml"),
    `<urlset>${paths.map((path) => `<url><loc>${siteUrl}${path}</loc></url>`).join("")}</urlset>`,
  );
  await writeFile(
    join(outputDirectory, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`,
  );
  return outputDirectory;
};

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("checkSeoBuild", () => {
  it("accepts complete noindex Pages output", async () => {
    const outputDirectory = await createOutput();

    await expect(
      checkSeoBuild({ outputDirectory, siteUrl, indexing: false, offerRecords }),
    ).resolves.toBeUndefined();
  });

  it.each([
    ["missing title", "<title>Strona /wyjazdy</title>", ""],
    ["wrong language", 'lang="pl"', 'lang="en"'],
    ["signed URL", "Pełna treść strony.", "https://storage.example/object/sign/image?token=secret"],
  ])("rejects %s", async (_name, source, replacement) => {
    const outputDirectory = await createOutput();
    const file = outputFile(outputDirectory, "/wyjazdy");
    const content = html("/wyjazdy").replace(source, replacement);
    await writeFile(file, content);

    await expect(
      checkSeoBuild({ outputDirectory, siteUrl, indexing: false, offerRecords }),
    ).rejects.toThrow();
  });
});
