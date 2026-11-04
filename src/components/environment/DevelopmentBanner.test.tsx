import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DevelopmentBanner } from "./DevelopmentBanner";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("DevelopmentBanner", () => {
  it("identifies the develop deployment even in a production-mode Vite build", () => {
    vi.stubEnv("VITE_SITE_URL", "https://develop.vhsboard.pages.dev");
    vi.stubEnv("DEV", false);
    render(<DevelopmentBanner />);
    expect(screen.getByText("WERSJA DEWELOPERSKA")).toBeInTheDocument();
  });

  it.each(["https://vhsboard.pages.dev", "https://vhsboard.pl", "http://localhost:3000"])(
    "does not label the production or local site %s",
    (siteUrl) => {
      vi.stubEnv("VITE_SITE_URL", siteUrl);
      render(<DevelopmentBanner />);
      expect(screen.queryByText("WERSJA DEWELOPERSKA")).not.toBeInTheDocument();
    },
  );
});
