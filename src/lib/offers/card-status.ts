import { getTodayInWarsaw } from "./home-offers";
import type { PublicOffer } from "./types";

export const getOfferCardStatus = (
  offer: Pick<PublicOffer, "endDate" | "showLastPlacesBadge">,
  today = getTodayInWarsaw(),
): { isFinished: boolean; showLastPlacesBadge: boolean } => {
  const isFinished = offer.endDate !== null && offer.endDate < today;

  return {
    isFinished,
    showLastPlacesBadge: !isFinished && offer.showLastPlacesBadge,
  };
};
