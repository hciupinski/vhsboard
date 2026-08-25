import { queryOptions } from "@tanstack/react-query";
import type { OfferKind } from "./types";

export const publishedOffersQueryOptions = (kind: OfferKind = "trip") =>
  queryOptions({
    queryKey: ["published-offers", kind] as const,
    queryFn: async () => {
      const { listPublishedOffers } = await import("./public-repository");
      return listPublishedOffers(kind);
    },
    refetchOnMount: "always",
  });

export const publishedOfferQueryOptions = (slug: string, kind: OfferKind = "trip") =>
  queryOptions({
    queryKey: ["published-offer", kind, slug] as const,
    queryFn: async () => {
      const { getPublishedOfferBySlug } = await import("./public-repository");
      return getPublishedOfferBySlug(slug, kind);
    },
    refetchOnMount: "always",
  });
