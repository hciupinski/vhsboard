import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PublicJsonLd } from "./PublicJsonLd";

vi.mock("@/lib/site-config", () => ({
  getPublicSiteConfig: () => ({ businessName: "VHSBOARD" }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

it("uses the canonical directory URL in the breadcrumb", () => {
  vi.stubEnv("VITE_SITE_URL", "https://vhsboard.pages.dev");
  vi.stubEnv("VITE_SEO_INDEXING", "false");
  const { container } = render(<PublicJsonLd path="/wypozyczalnia" label="Wypożyczalnia" />);
  const data = JSON.parse(
    container.querySelector('script[type="application/ld+json"]')!.textContent!,
  );
  expect(data[0].itemListElement[1].item).toBe("https://vhsboard.pages.dev/wypozyczalnia/");
});
