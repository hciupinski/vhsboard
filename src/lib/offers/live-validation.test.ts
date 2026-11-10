import { describe, expect, it } from "vitest";

import { changeEditableOfferKind, createEmptyEditableOfferInput } from "./editor-schema";
import { recordEditedFields, visibleOfferErrors } from "./live-validation";

describe("live validation visibility", () => {
  it("does not mark a blank day-camp form invalid immediately after switching kind", () => {
    const trip = createEmptyEditableOfferInput();
    const dayCamp = changeEditableOfferKind(trip, "day_camp");

    expect(recordEditedFields(trip, dayCamp, new Set(["title"]))).toEqual(new Set());
  });

  it("shows a changed field's error without revealing untouched required fields", () => {
    const initial = createEmptyEditableOfferInput();
    const next = { ...initial, title: "A" };

    const errors = {
      title: "Tytuł musi mieć od 3 do 120 znaków.",
      location: "Uzupełnij lokalizację.",
    };
    expect(visibleOfferErrors(errors, recordEditedFields(initial, next, new Set()))).toEqual({
      title: "Tytuł musi mieć od 3 do 120 znaków.",
    });
  });
});
