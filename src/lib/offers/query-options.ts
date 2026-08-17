import { queryOptions } from "@tanstack/react-query";

export const publishedOffersQueryOptions = () =>
  queryOptions({
    queryKey: ["published-offers"] as const,
    queryFn: async () => {
      const { listPublishedOffers } = await import("./public-repository");
      return listPublishedOffers();
    },
    refetchOnMount: "always",
  });

export const publishedOfferQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["published-offer", slug] as const,
    queryFn: async () => {
      const { getPublishedOfferBySlug } = await import("./public-repository");
      return getPublishedOfferBySlug(slug);
    },
    refetchOnMount: "always",
  });
