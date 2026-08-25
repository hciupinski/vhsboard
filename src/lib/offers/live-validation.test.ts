import { describe, expect, it } from "vitest";

import { changeEditableOfferKind, createEmptyEditableOfferInput } from "./editor-schema";
import { getLiveFieldErrors } from "./live-validation";

describe("getLiveFieldErrors", () => {
  it("does not mark a blank day-camp form invalid immediately after switching kind", () => {
    const trip = createEmptyEditableOfferInput();
    const dayCamp = changeEditableOfferKind(trip, "day_camp");

    expect(getLiveFieldErrors(trip, dayCamp, {})).toEqual({});
  });

  it("shows a changed field's error without revealing untouched required fields", () => {
    const initial = createEmptyEditableOfferInput();
    const next = { ...initial, title: "A" };

    expect(getLiveFieldErrors(initial, next, {})).toEqual({
      title: "Tytuł musi mieć od 3 do 120 znaków.",
    });
  });
});
