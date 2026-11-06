import type { PublicOffer, TripOffer } from "./types";

export const selectRelatedTrips = (
  offers: PublicOffer[],
  currentOfferId: string,
  today: string,
): TripOffer[] =>
  offers
    .filter((offer) => offer.startDate !== null && offer.startDate >= today)
    .sort(
      (a, b) => a.startDate!.localeCompare(b.startDate!) || a.title.localeCompare(b.title, "pl"),
    )
    .filter(
      (offer): offer is TripOffer => offer.offerKind === "trip" && offer.id !== currentOfferId,
    )
    .slice(0, 3);
