import { selectUpcomingHomeOffers } from "./home-offers";
import type { PublicOffer, TripOffer } from "./types";

export const selectRelatedTrips = (
  offers: PublicOffer[],
  currentOfferId: string,
  today: string,
): TripOffer[] =>
  selectUpcomingHomeOffers(offers, today)
    .filter(
      (offer): offer is TripOffer => offer.offerKind === "trip" && offer.id !== currentOfferId,
    )
    .slice(0, 3);
