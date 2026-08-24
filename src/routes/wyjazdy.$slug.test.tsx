import { describe, expect, it, vi } from "vitest";

import { Route } from "./wyjazdy.$slug";

describe("trip detail route", () => {
  it("loads a published offer under /wyjazdy/:slug", async () => {
    const offer = {
      slug: "atlantic-surf-week",
      title: "Atlantycki tydzień surfingu",
      location: "Ericeira, Portugalia",
      shortDescription: "Siedem dni w Ericeirze.",
    };
    const ensureQueryData = vi.fn().mockResolvedValue(offer);

    await expect(
      Route.options.loader?.({
        context: { queryClient: { ensureQueryData } },
        params: { slug: offer.slug },
      } as never),
    ).resolves.toEqual({ offer, slug: offer.slug });
  });
});
