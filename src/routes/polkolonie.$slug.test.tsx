import { describe, expect, it, vi } from "vitest";

import { Route } from "./polkolonie.$slug";

describe("day-camp detail route", () => {
  it("loads only a published day camp under /polkolonie/:slug", async () => {
    const offer = {
      slug: "wakeboardowe-lato",
      offerKind: "day_camp",
      title: "Wakeboardowe lato",
      shortDescription: "Pięć dni ruchu i nauki na wodzie.",
    };
    const ensureQueryData = vi.fn().mockResolvedValue(offer);

    await expect(
      Route.options.loader?.({
        context: { queryClient: { ensureQueryData } },
        params: { slug: offer.slug },
      } as never),
    ).resolves.toEqual({ offer, slug: offer.slug });
  });

  it("returns not found when a trip is requested through the day-camp path", async () => {
    const ensureQueryData = vi.fn().mockResolvedValue({ offerKind: "trip" });

    await expect(
      Route.options.loader?.({
        context: { queryClient: { ensureQueryData } },
        params: { slug: "atlantic-surf-week" },
      } as never),
    ).rejects.toMatchObject({ isNotFound: true });
  });
});
