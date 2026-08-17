import { describe, expect, it } from "vitest";

import { formatGroupSize, formatPriceFrom, formatTripDates } from "./formatters";

describe("offer formatters", () => {
  it("formats a PLN starting price using Polish currency conventions", () => {
    expect(formatPriceFrom(3100, "PLN")).toBe("3100 zł");
  });

  it("formats a single trip date", () => {
    expect(formatTripDates("2026-06-12", "2026-06-12")).toBe("12 czerwca 2026");
  });

  it("formats a date range in one month", () => {
    expect(formatTripDates("2026-06-12", "2026-06-18")).toBe("12–18 czerwca 2026");
  });

  it("formats partial and missing trip dates with Polish labels", () => {
    expect(formatTripDates("2026-06-12", null)).toBe("Od 12 czerwca 2026");
    expect(formatTripDates(null, "2026-06-18")).toBe("Do 18 czerwca 2026");
    expect(formatTripDates(null, null)).toBe("Termin wkrótce");
  });

  it("formats a group size range", () => {
    expect(formatGroupSize(12, 18)).toBe("12–18 osób");
  });

  it("formats one-sided and missing group sizes without inventing zero people", () => {
    expect(formatGroupSize(12, null)).toBe("Od 12 osób");
    expect(formatGroupSize(null, 18)).toBe("Do 18 osób");
    expect(formatGroupSize(null, null)).toBe("Liczebność grupy wkrótce");
  });
});
