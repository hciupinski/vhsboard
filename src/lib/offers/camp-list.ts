import { selectListingOffers } from "./offer-timing";
import type { DayCampOffer, PublicOffer } from "./types";
export const selectCampListingOffers = (
  offers: readonly PublicOffer[],
  today: string,
): DayCampOffer[] =>
  selectListingOffers(
    offers.filter((offer): offer is DayCampOffer => offer.offerKind === "day_camp"),
    today,
  );
