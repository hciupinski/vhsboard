import { getOfferCardStatus } from "./card-status";
import type { DayCampOffer, PublicOffer } from "./types";

const compareTitles = (first: DayCampOffer, second: DayCampOffer): number =>
  first.title.localeCompare(second.title, "pl") || first.id.localeCompare(second.id);

export const selectCampListingOffers = (
  offers: readonly PublicOffer[],
  today: string,
): DayCampOffer[] => {
  const camps = offers.filter((offer): offer is DayCampOffer => offer.offerKind === "day_camp");
  const active = camps
    .filter((offer) => !getOfferCardStatus(offer, today).isFinished)
    .sort((first, second) => {
      if (first.startDate !== second.startDate) {
        if (first.startDate === null) return 1;
        if (second.startDate === null) return -1;
        return first.startDate.localeCompare(second.startDate);
      }
      return compareTitles(first, second);
    });
  const finished = camps
    .filter((offer) => getOfferCardStatus(offer, today).isFinished)
    .sort(
      (first, second) =>
        second.endDate!.localeCompare(first.endDate!) || compareTitles(first, second),
    );

  return [...active, ...finished.slice(0, Math.max(0, 3 - active.length))];
};
