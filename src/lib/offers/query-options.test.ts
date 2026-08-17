import { describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  getPublishedOfferBySlug: vi.fn(),
  listPublishedOffers: vi.fn(),
}));

vi.mock("./public-repository", () => repository);

import { publishedOfferQueryOptions, publishedOffersQueryOptions } from "./query-options";

describe("public offer query options", () => {
  it("uses a stable list key and refetches after hydration", () => {
    const options = publishedOffersQueryOptions();

    expect(options.queryKey).toEqual(["published-offers"]);
    expect(options.refetchOnMount).toBe("always");
  });

  it("scopes the detail key and repository call to its slug", async () => {
    const offer = { slug: "atlantic-surf-week" };
    repository.getPublishedOfferBySlug.mockResolvedValue(offer);
    const options = publishedOfferQueryOptions("atlantic-surf-week");

    await expect(options.queryFn()).resolves.toEqual(offer);
    expect(options.queryKey).toEqual(["published-offer", "atlantic-surf-week"]);
    expect(repository.getPublishedOfferBySlug).toHaveBeenCalledWith("atlantic-surf-week");
  });
});
