import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

import { checkSeoBuild } from "./check-seo-build";

const directories: string[] = [];
const siteUrl = "https://vhsboard.pages.dev";
const staticPaths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/obozy", "/kontakt"];

const outputFile = (outputDirectory: string, path: string) =>
  path === "/" ? join(outputDirectory, "index.html") : join(outputDirectory, path, "index.html");

const socialTags = (path: string) => {
  const key =
    (
      {
        "/": "home",
        "/o-nas": "about",
        "/wyjazdy": "trips",
        "/eventy": "events",
        "/obozy": "camps",
        "/kontakt": "contact",
      } as Record<string, string>
    )[path] ?? "offers";
  return `<meta property="og:image" content="${siteUrl}/og/${key}.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:alt" content="VHSBOARD"><meta name="twitter:image" content="${siteUrl}/og/${key}.jpg"><meta name="twitter:card" content="summary_large_image">`;
};
const html = (path: string, body = "Pełna treść strony.") => `<!doctype html>
<html lang="pl"><head>
  <title>Strona ${path}</title>
${socialTags(path)}
  <meta name="description" content="Opis strony ${path}.">
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${siteUrl}${path}">
</head><body>${body}</body></html>`;

const createOutput = async (indexing = false) => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "vhsboard-seo-check-"));
  directories.push(outputDirectory);
  await mkdir(join(outputDirectory, "og"));
  const image = await sharp({
    create: { width: 1200, height: 630, channels: 3, background: "#fff2da" },
  })
    .jpeg()
    .toBuffer();
  for (const key of ["home", "about", "trips", "events", "camps", "contact", "offers"])
    await writeFile(join(outputDirectory, "og", `${key}.jpg`), image);
  const paths = staticPaths;
  for (const path of paths) {
    const file = outputFile(outputDirectory, path);
    await mkdir(join(file, ".."), { recursive: true });
    await writeFile(
      file,
      html(path).replace("noindex, nofollow", indexing ? "index, follow" : "noindex, nofollow"),
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
  await mkdir(join(outputDirectory, "_shell"), { recursive: true });
  await writeFile(
    join(outputDirectory, "_shell", "app.html"),
    `<!doctype html><html lang="pl"><head><meta name="robots" content="${indexing ? "index, follow" : "noindex, nofollow"}">${socialTags("offers")}</head></html>`,
  );
  await writeFile(
    join(outputDirectory, "_shell", "admin.html"),
    '<html lang="pl"><head><meta name="robots" content="noindex, nofollow"></head></html>',
  );
  await writeFile(
    join(outputDirectory, "_redirects"),
    "/trips/:slug /wyjazdy/:slug 301\n/wyjazdy/:slug /_shell/app 200\n/obozy/:slug /_shell/app 200\n/admin /_shell/admin 200\n/admin/* /_shell/admin 200\n",
  );
  return outputDirectory;
};

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("checkSeoBuild", () => {
  it.each([true, false])("checks the public shell against indexing=%s", async (indexing) => {
    const outputDirectory = await createOutput(indexing);
    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing })).resolves.toBeUndefined();
    await writeFile(
      join(outputDirectory, "_shell", "app.html"),
      '<html lang="pl"><meta name="robots" content="unexpected"></html>',
    );
    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing })).rejects.toThrow();
  });
  it("rejects an indexable or missing admin shell", async () => {
    const outputDirectory = await createOutput();
    const file = join(outputDirectory, "_shell", "admin.html");
    await writeFile(file, '<html lang="pl"><meta name="robots" content="index, follow"></html>');
    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing: false })).rejects.toThrow();
    await rm(file);
    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing: false })).rejects.toThrow();
  });
  it("rejects admin rewrites to the public shell", async () => {
    const outputDirectory = await createOutput();
    await writeFile(
      join(outputDirectory, "_redirects"),
      "/trips/:slug /wyjazdy/:slug 301\n/wyjazdy/:slug /_shell/app 200\n/obozy/:slug /_shell/app 200\n/admin /_shell/app 200\n/admin/* /_shell/app 200\n",
    );
    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing: false })).rejects.toThrow();
  });
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
    const offerFile = outputFile(outputDirectory, "/obozy/wakeboard-2026");
    await mkdir(join(offerFile, ".."), { recursive: true });
    await writeFile(offerFile, html("/obozy/wakeboard-2026"));

    await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing: false })).rejects.toThrow(
      "statycznych szczegółów ofert",
    );
  });
});

it.each(["missing", "dimensions"])("rejects %s social assets", async (condition) => {
  const outputDirectory = await createOutput();
  const file = join(outputDirectory, "og/home.jpg");
  if (condition === "missing") await rm(file);
  else
    await writeFile(
      file,
      await sharp({ create: { width: 200, height: 100, channels: 3, background: "red" } })
        .jpeg()
        .toBuffer(),
    );
  await expect(checkSeoBuild({ outputDirectory, siteUrl, indexing: false })).rejects.toThrow();
});
