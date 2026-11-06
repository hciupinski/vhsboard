import type { PublicOffer } from "./types";

export type DateStatus = "future" | "ongoing" | "finished" | "unknown";
export function getDateStatus(start: string | null, end: string | null, today: string): DateStatus {
  if (end && end < today) return "finished";
  if (start && start > today) return "future";
  if (start && end && start <= today && end >= today) return "ongoing";
  return "unknown";
}
export function getOfferTiming(
  offer: PublicOffer,
  today: string,
): { status: DateStatus; sortDate: string | null } {
  const terms = offer.offerKind === "day_camp" ? (offer.campTermDates ?? offer.content.terms) : [];
  if (terms.length) {
    const ongoing = terms.filter((t) => getDateStatus(t.startDate, t.endDate, today) === "ongoing");
    if (ongoing.length)
      return { status: "ongoing", sortDate: ongoing.map((t) => t.startDate).sort()[0] ?? null };
    const future = terms.filter((t) => getDateStatus(t.startDate, t.endDate, today) === "future");
    if (future.length)
      return { status: "future", sortDate: future.map((t) => t.startDate).sort()[0] ?? null };
    if (terms.every((t) => getDateStatus(t.startDate, t.endDate, today) === "finished"))
      return {
        status: "finished",
        sortDate:
          terms
            .map((t) => t.endDate)
            .sort()
            .at(-1) ?? null,
      };
    return { status: "unknown", sortDate: null };
  }
  const status = getDateStatus(offer.startDate, offer.endDate, today);
  return { status, sortDate: status === "finished" ? offer.endDate : offer.startDate };
}
export function selectListingOffers<T extends PublicOffer>(
  offers: readonly T[],
  today: string,
  excludeUndated = false,
): T[] {
  const items = offers
    .filter((o) => !excludeUndated || o.startDate !== null)
    .map((offer) => ({ offer, ...getOfferTiming(offer, today) }));
  const rank: Record<DateStatus, number> = { future: 0, ongoing: 1, unknown: 2, finished: 3 };
  items.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      (a.sortDate === b.sortDate
        ? 0
        : !a.sortDate
          ? 1
          : !b.sortDate
            ? -1
            : a.status === "finished"
              ? b.sortDate.localeCompare(a.sortDate)
              : a.sortDate.localeCompare(b.sortDate)) ||
      a.offer.title.localeCompare(b.offer.title, "pl") ||
      a.offer.id.localeCompare(b.offer.id),
  );
  const active = items.filter((i) => i.status !== "finished");
  return [
    ...active,
    ...items.filter((i) => i.status === "finished").slice(0, Math.max(0, 3 - active.length)),
  ].map((i) => i.offer);
}
export function hasFutureBooking(offer: PublicOffer, today: string): boolean {
  if (offer.offerKind === "day_camp" && offer.content.terms.length)
    return offer.content.terms.some((t) => t.startDate > today);
  if (offer.endDate !== null && offer.endDate < today) return false;
  return offer.startDate === null || offer.startDate > today;
}
