import { describe, expect, it } from "vitest";

import type { PublicOffer } from "./types";
import { getOfferCardStatus } from "./card-status";

describe("getOfferCardStatus", () => {
  it("marks offers that ended before today as finished and hides their badge", () => {
    expect(
      getOfferCardStatus(
        {
          offerKind: "trip" as const,
          startDate: null,
          endDate: "2026-09-27",
          showLastPlacesBadge: true,
        } as PublicOffer,
        "2026-09-28",
      ),
    ).toEqual({ isFinished: true, isOngoing: false, showLastPlacesBadge: false });
  });

  it("keeps offers ending today active with their manual badge setting", () => {
    expect(
      getOfferCardStatus(
        {
          offerKind: "trip" as const,
          startDate: null,
          endDate: "2026-09-28",
          showLastPlacesBadge: true,
        } as PublicOffer,
        "2026-09-28",
      ),
    ).toEqual({ isFinished: false, isOngoing: false, showLastPlacesBadge: true });
  });

  it("keeps offers without an end date active with their manual badge setting", () => {
    expect(
      getOfferCardStatus(
        {
          offerKind: "trip" as const,
          startDate: null,
          endDate: null,
          showLastPlacesBadge: true,
        } as PublicOffer,
        "2026-09-28",
      ),
    ).toEqual({
      isFinished: false,
      isOngoing: false,
      showLastPlacesBadge: true,
    });
  });
});
