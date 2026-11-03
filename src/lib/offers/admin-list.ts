import type { AdminOfferListItem } from "./admin-repository";

const titleCollator = new Intl.Collator("pl");

export const isAdminOfferFinished = (
  offer: Pick<AdminOfferListItem, "endDate">,
  today: string,
): boolean => offer.endDate !== null && offer.endDate < today;

export const sortAdminOffers = (
  offers: readonly AdminOfferListItem[],
  today: string,
): AdminOfferListItem[] =>
  [...offers].sort((a, b) => {
    const finishedDifference =
      Number(isAdminOfferFinished(a, today)) - Number(isAdminOfferFinished(b, today));
    if (finishedDifference !== 0) return finishedDifference;
    if (a.startDate !== b.startDate) {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return a.startDate < b.startDate ? -1 : 1;
    }
    return titleCollator.compare(a.title, b.title) || a.id.localeCompare(b.id);
  });
