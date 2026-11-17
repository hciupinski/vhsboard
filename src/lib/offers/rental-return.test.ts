import { describe, expect, it } from "vitest";
import { defaultParseSearch } from "@tanstack/react-router";
import { rentalReturn, rentalSearch } from "./rental-return";

describe("rental return", () => {
  it.each(["123", "true", "false", "null"])(
    "round-trips slug %s through TanStack search parsing",
    (slug) => {
      const parsed = defaultParseSearch(rentalSearch("trip", slug)) as Record<string, string>;
      expect(rentalReturn(parsed["kind"]!, parsed["slug"]!)).toEqual({
        href: `/wyjazdy/${slug}/`,
        label: "Wróć do oferty",
      });
    },
  );
  it.each([
    ["trip", "surf-2026", "/wyjazdy/surf-2026/"],
    ["day_camp", "obozy-2026", "/obozy/obozy-2026/"],
  ])("returns to %s details", (kind, slug, href) => {
    expect(rentalReturn(kind!, slug!)).toEqual({ href, label: "Wróć do oferty" });
  });
  it.each([
    ["", ""],
    ["trip", "../kontakt"],
    ["https://evil.test", "trip"],
  ])("uses trips fallback for invalid input", (kind, slug) => {
    expect(rentalReturn(kind!, slug!)).toEqual({ href: "/wyjazdy/", label: "Wróć do wyjazdów" });
  });
});
