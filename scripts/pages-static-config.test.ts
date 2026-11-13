import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Cloudflare Pages static configuration", () => {
  it("uses a standalone noindex 404 page while retaining explicit dynamic shell rewrites", async () => {
    const [page, redirects] = await Promise.all([
      readFile("public/404.html", "utf8"),
      readFile("public/_redirects", "utf8"),
    ]);
    expect(page).toMatch(/<meta name="robots" content="noindex, nofollow"/);
    expect(page).toContain("Nie znaleziono strony");
    expect(page).toContain('href="/wyjazdy"');
    expect(redirects).toContain("/wyjazdy/:slug /_shell/app 200");
    expect(redirects).toContain("/obozy/:slug /_shell/app 200");
    expect(redirects).toContain("/admin/* /_shell/admin 200");
  });

  it("limits long-lived browser caching to generated Vite assets", async () => {
    const headers = await readFile("public/_headers", "utf8");
    expect(headers.trim()).toBe("/assets/*\n  Cache-Control: public, max-age=31536000, immutable");
    await expect(readdir("public/assets")).rejects.toMatchObject({ code: "ENOENT" });
  });
});
