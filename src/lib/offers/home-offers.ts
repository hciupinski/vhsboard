import type { PublicOffer } from "./types";

export const getTodayInWarsaw = (now = new Date()): string => {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = dateParts.find((part) => part.type === "year")?.value;
  const month = dateParts.find((part) => part.type === "month")?.value;
  const day = dateParts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Nie udało się odczytać bieżącej daty dla strefy Europe/Warsaw.");
  }

  return `${year}-${month}-${day}`;
};

export const selectUpcomingHomeOffers = (
  offers: PublicOffer[],
  today: string,
  limit = 3,
): PublicOffer[] =>
  offers
    .filter((offer) => offer.startDate !== null && offer.startDate >= today)
    .sort(
      (first, second) =>
        first.startDate!.localeCompare(second.startDate!) ||
        first.title.localeCompare(second.title, "pl"),
    )
    .slice(0, limit);
