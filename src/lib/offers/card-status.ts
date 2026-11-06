import { getTodayInWarsaw } from "./home-offers";
import { getOfferTiming } from "./offer-timing";
import type { PublicOffer } from "./types";
export const getOfferCardStatus = (offer: PublicOffer, today = getTodayInWarsaw()) => {
  const status = getOfferTiming(offer, today).status;
  return {
    isFinished: status === "finished",
    isOngoing: status === "ongoing",
    showLastPlacesBadge: status !== "finished" && status !== "ongoing" && offer.showLastPlacesBadge,
  };
};
