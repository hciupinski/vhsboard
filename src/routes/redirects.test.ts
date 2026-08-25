import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("Cloudflare Pages redirects", () => {
  it("permanently redirects old trip detail paths and uses the SPA shell for dynamic routes", () => {
    const redirects = readFileSync(resolve(process.cwd(), "public/_redirects"), "utf8");

    expect(redirects.trim()).toBe("/trips/:slug /wyjazdy/:slug 301\n/* /_shell.html 200");
  });
});
