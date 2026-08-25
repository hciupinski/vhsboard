import { afterEach, describe, expect, it, vi } from "vitest";

import { canonicalUrl, createPageMetadata, getSeoConfig, serializeJsonLd } from "./seo";

const setSeoEnvironment = (
  values?: Partial<Record<"VITE_SITE_URL" | "VITE_SEO_INDEXING", string>>,
) => {
  vi.stubEnv("VITE_SITE_URL", values?.VITE_SITE_URL ?? "https://vhsboard.pages.dev");
  vi.stubEnv("VITE_SEO_INDEXING", values?.VITE_SEO_INDEXING ?? "false");
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("SEO configuration", () => {
  it("requires an HTTPS origin and an explicit indexing flag", () => {
    setSeoEnvironment({ VITE_SITE_URL: "http://vhsboard.pages.dev" });
    expect(getSeoConfig).toThrow("VITE_SITE_URL");

    setSeoEnvironment({ VITE_SITE_URL: "https://vhsboard.pages.dev/path" });
    expect(getSeoConfig).toThrow("VITE_SITE_URL");

    setSeoEnvironment({ VITE_SEO_INDEXING: "yes" });
    expect(getSeoConfig).toThrow("VITE_SEO_INDEXING");
  });
});

describe("canonicalUrl", () => {
  it.each([
    "https://attacker.example/wyjazdy",
    "//attacker.example/wyjazdy",
    "/wyjazdy/../admin",
    "/wyjazdy/%2Fadmin",
  ])("rejects unsafe path %s", (path) => {
    setSeoEnvironment();
    expect(() => canonicalUrl(path)).toThrow();
  });

  it("uses the configured origin and removes query and fragment", () => {
    setSeoEnvironment({ VITE_SEO_INDEXING: "true" });

    expect(canonicalUrl("/wyjazdy?utm_source=test#details")).toBe(
      "https://vhsboard.pages.dev/wyjazdy",
    );
  });
});

describe("createPageMetadata", () => {
  it("makes a Pages build noindex while preserving its canonical metadata", () => {
    setSeoEnvironment({ VITE_SEO_INDEXING: "false" });

    expect(
      createPageMetadata({
        path: "/wyjazdy",
        title: "Wyjazdy | VHSBOARD",
        description: "Aktualne wyjazdy VHSBOARD.",
      }),
    ).toMatchObject({
      meta: expect.arrayContaining([
        { name: "robots", content: "noindex, nofollow" },
        { property: "og:locale", content: "pl_PL" },
        { property: "og:url", content: "https://vhsboard.pages.dev/wyjazdy" },
      ]),
      links: [{ rel: "canonical", href: "https://vhsboard.pages.dev/wyjazdy" }],
    });
  });
});

describe("serializeJsonLd", () => {
  it("neutralizes characters that can break a JSON-LD script", () => {
    const serialized = serializeJsonLd({ value: "<>&\u2028\u2029" });

    expect(serialized).toBe('{"value":"\\u003C\\u003E\\u0026\\u2028\\u2029"}');
    expect(serialized).not.toMatch(/[<>&\u2028\u2029]/);
  });
});
