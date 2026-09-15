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

export const offerDetailQueryOptions = (slug: string, kind: OfferKind = "trip", preview = false) =>
  queryOptions({
    queryKey: preview
      ? (["admin-preview-offer", kind, slug] as const)
      : (["published-offer", kind, slug] as const),
    queryFn: async () => {
      if (preview) {
        const { getAdminPreviewOfferBySlug } = await import("./admin-repository");
        return getAdminPreviewOfferBySlug(slug, kind);
      }

      const { getPublishedOfferBySlug } = await import("./public-repository");
      return getPublishedOfferBySlug(slug, kind);
    },
    refetchOnMount: "always",
  });

export const publishedOfferQueryOptions = (slug: string, kind: OfferKind = "trip") =>
  offerDetailQueryOptions(slug, kind);
