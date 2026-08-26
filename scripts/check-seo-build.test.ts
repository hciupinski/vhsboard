import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { checkSeoBuild } from "./check-seo-build";

const directories: string[] = [];
const siteUrl = "https://vhsboard.pages.dev";
const staticPaths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/polkolonie", "/kontakt"];

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
  const paths = staticPaths;
  for (const path of paths) {
    const file = outputFile(outputDirectory, path);
    await mkdir(join(file, ".."), { recursive: true });
    await writeFile(file, html(path));
  }
  await writeFile(
    join(outputDirectory, "sitemap.xml"),
    `<urlset>${paths.map((path) => `<url><loc>${siteUrl}${path}</loc></url>`).join("")}</urlset>`,
  );
  await writeFile(
    join(outputDirectory, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`,
  );
  await mkdir(join(outputDirectory, "_shell"), { recursive: true });
  await writeFile(
    join(outputDirectory, "_shell", "app.html"),
    '<!doctype html><html lang="pl"></html>',
  );
  await writeFile(
    join(outputDirectory, "_redirects"),
    "/trips/:slug /wyjazdy/:slug 301\n/wyjazdy/:slug /_shell/app 200\n/polkolonie/:slug /_shell/app 200\n/admin /_shell/app 200\n/admin/* /_shell/app 200\n",
  );
  return outputDirectory;
};

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("checkSeoBuild", () => {
  it("accepts Pages output with a dedicated SPA shell for dynamic routes", async () => {
    const outputDirectory = await createOutput();

    await expect(
      checkSeoBuild({ outputDirectory, siteUrl, indexing: false }),
    ).resolves.toBeUndefined();
  });

  it("rejects output without the SPA shell for dynamic routes", async () => {
    const outputDirectory = await createOutput();
    await rm(join(outputDirectory, "_shell", "app.html"));

    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing: false })).rejects.toThrow(
      "shella SPA",
    );
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

    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing: false })).rejects.toThrow();
  });

  it("rejects a prerendered offer detail", async () => {
    const outputDirectory = await createOutput();
    const offerFile = outputFile(outputDirectory, "/polkolonie/wakeboard-2026");
    await mkdir(join(offerFile, ".."), { recursive: true });
    await writeFile(offerFile, html("/polkolonie/wakeboard-2026"));

    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing: false })).rejects.toThrow(
      "statycznych szczegółów ofert",
    );
  });
});
