import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("Cloudflare Pages redirects", () => {
  it("serves dynamic details and CMS through the SPA shell", () => {
    const redirects = readFileSync(resolve(process.cwd(), "public/_redirects"), "utf8");

    expect(redirects.trim()).toBe(
      "/trips/:slug /wyjazdy/:slug 301\n/wyjazdy/:slug /_shell/app 200\n/polkolonie/:slug /_shell/app 200\n/admin /_shell/app 200\n/admin/* /_shell/app 200",
    );
  });
});
