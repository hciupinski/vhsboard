import { describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  getPublishedOfferBySlug: vi.fn(),
  listPublishedOffers: vi.fn(),
}));

vi.mock("./public-repository", () => repository);

import * as offerQueries from "./query-options";

const { publishedOfferQueryOptions, publishedOffersQueryOptions } = offerQueries;

describe("public offer query options", () => {
  it("uses a stable list key and refetches after hydration", () => {
    const options = publishedOffersQueryOptions();

    expect(options.queryKey).toEqual(["published-offers", "trip"]);
    expect(options.refetchOnMount).toBe("always");
  });

  it("scopes the detail key and repository call to its slug", async () => {
    const offer = { slug: "atlantic-surf-week" };
    repository.getPublishedOfferBySlug.mockResolvedValue(offer);
    const options = publishedOfferQueryOptions("atlantic-surf-week");

    await expect(options.queryFn()).resolves.toEqual(offer);
    expect(options.queryKey).toEqual(["published-offer", "trip", "atlantic-surf-week"]);
    expect(repository.getPublishedOfferBySlug).toHaveBeenCalledWith("atlantic-surf-week", "trip");
  });

  it("keeps day-camp cache entries and calls separate from trips", async () => {
    const offer = { slug: "wakeboardowe-lato" };
    repository.listPublishedOffers.mockResolvedValue([offer]);
    repository.getPublishedOfferBySlug.mockResolvedValue(offer);

    const list = publishedOffersQueryOptions("day_camp");
    const detail = publishedOfferQueryOptions("wakeboardowe-lato", "day_camp");

    await expect(list.queryFn()).resolves.toEqual([offer]);
    await expect(detail.queryFn()).resolves.toEqual(offer);
    expect(list.queryKey).toEqual(["published-offers", "day_camp"]);
    expect(detail.queryKey).toEqual(["published-offer", "day_camp", "wakeboardowe-lato"]);
    expect(repository.listPublishedOffers).toHaveBeenCalledWith("day_camp");
    expect(repository.getPublishedOfferBySlug).toHaveBeenCalledWith(
      "wakeboardowe-lato",
      "day_camp",
    );
  });

  it("combines published trip and camp lists for the home page", async () => {
    const homeOffersQueryOptions = (
      offerQueries as typeof offerQueries & {
        homeOffersQueryOptions?: () => {
          queryKey: readonly string[];
          queryFn: () => Promise<unknown>;
        };
      }
    ).homeOffersQueryOptions;

    expect(homeOffersQueryOptions).toBeTypeOf("function");

    repository.listPublishedOffers
      .mockResolvedValueOnce([{ slug: "atlantic-surf-week" }])
      .mockResolvedValueOnce([{ slug: "wakeboardowe-lato" }]);

    const options = homeOffersQueryOptions!();

    await expect(options.queryFn()).resolves.toEqual([
      { slug: "atlantic-surf-week" },
      { slug: "wakeboardowe-lato" },
    ]);
    expect(options.queryKey).toEqual(["home-offers"]);
    expect(repository.listPublishedOffers).toHaveBeenCalledWith("trip");
    expect(repository.listPublishedOffers).toHaveBeenCalledWith("day_camp");
  });
});
