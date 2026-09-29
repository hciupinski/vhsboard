import { describe, expect, it } from "vitest";

import { getOfferCardStatus } from "./card-status";

describe("getOfferCardStatus", () => {
  it("marks offers that ended before today as finished and hides their badge", () => {
    expect(
      getOfferCardStatus({ endDate: "2026-09-27", showLastPlacesBadge: true }, "2026-09-28"),
    ).toEqual({ isFinished: true, showLastPlacesBadge: false });
  });

  it("keeps offers ending today active with their manual badge setting", () => {
    expect(
      getOfferCardStatus({ endDate: "2026-09-28", showLastPlacesBadge: true }, "2026-09-28"),
    ).toEqual({ isFinished: false, showLastPlacesBadge: true });
  });

  it("keeps offers without an end date active with their manual badge setting", () => {
    expect(getOfferCardStatus({ endDate: null, showLastPlacesBadge: true }, "2026-09-28")).toEqual({
      isFinished: false,
      showLastPlacesBadge: true,
    });
  });
});
