import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getRouter } from "./router";

describe("application query cache", () => {
  it("restores navigation positions without applying smooth scrolling to the document", () => {
    expect(getRouter().options.scrollRestoration).toBe(true);
    const css = readFileSync("src/styles.css", "utf8");
    expect(css).not.toMatch(/html:has\(\[data-trip-detail\]\)\s*\{[^}]*scroll-behavior:\s*smooth/s);
  });

  it("marks public offer data stale before signed image URLs expire", () => {
    const router = getRouter();

    expect(router.options.context.queryClient.getDefaultOptions().queries?.staleTime).toBe(
      45 * 60 * 1000,
    );
  });
});
