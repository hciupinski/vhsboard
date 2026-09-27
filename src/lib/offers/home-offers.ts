import type { PublicOffer } from "./types";

export const selectUpcomingHomeOffers = (
  offers: PublicOffer[],
  today: string,
  limit = 3,
): PublicOffer[] =>
  offers
    .filter((offer) => offer.startDate !== null && offer.startDate >= today)
    .sort(
      (first, second) =>
        first.startDate!.localeCompare(second.startDate!) || first.title.localeCompare(second.title, "pl"),
    )
    .slice(0, limit);
