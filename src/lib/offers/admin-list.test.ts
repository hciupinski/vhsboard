import { describe, expect, it } from "vitest";
import type { AdminOfferListItem } from "./admin-repository";
import { isAdminOfferFinished, sortAdminOffers } from "./admin-list";

const today = "2026-11-03";
const offer = (
  id: string,
  startDate: string | null,
  endDate: string | null,
  extra: Partial<AdminOfferListItem> = {},
): AdminOfferListItem =>
  ({ id, title: id, startDate, endDate, status: "published", ...extra }) as AdminOfferListItem;

describe("admin offer ordering", () => {
  it("ends only after the last day, regardless of status or missing dates", () => {
    expect(isAdminOfferFinished(offer("yesterday", null, "2026-11-02"), today)).toBe(true);
    expect(isAdminOfferFinished(offer("today", null, today), today)).toBe(false);
    expect(isAdminOfferFinished(offer("ongoing", "2026-10-01", "2026-11-04"), today)).toBe(false);
    expect(isAdminOfferFinished(offer("no end", null, null), today)).toBe(false);
  });

  it("orders active dates, undated active offers, and finished offers without mutating input", () => {
    const items = [
      offer("finished-no-start", null, "2026-10-01"),
      offer("active-no-start", null, null),
      offer("finished-draft", "2026-09-01", "2026-10-01", { status: "draft" }),
      offer("future", "2026-12-01", null),
      offer("camp", "2026-10-01", "2026-11-10", { offerKind: "day_camp" }),
      offer("today", "2026-11-03", today, { status: "archived" }),
      offer("finished", "2026-10-01", "2026-10-02"),
      offer("no-end", "2026-11-04", null),
    ];
    const original = [...items];
    expect(sortAdminOffers(items, today).map(({ id }) => id)).toEqual([
      "camp",
      "today",
      "no-end",
      "future",
      "active-no-start",
      "finished-draft",
      "finished",
      "finished-no-start",
    ]);
    expect(items).toEqual(original);
  });

  it("breaks date ties by Polish title and id", () => {
    const items = [
      offer("b", "2026-12-01", null, { title: "Żagle" }),
      offer("z", "2026-12-01", null, { title: "Łódź" }),
      offer("a", "2026-12-01", null, { title: "Łódź" }),
    ];
    expect(sortAdminOffers(items, today).map(({ id }) => id)).toEqual(["a", "z", "b"]);
  });
});
