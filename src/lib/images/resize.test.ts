import { expect, it } from "vitest";
import { getResizedDimensions } from "./resize";
it("caps the long edge without enlarging small images", () => {
  expect(getResizedDimensions(4000, 3000, 1920)).toEqual({ width: 1920, height: 1440 });
  expect(getResizedDimensions(3000, 4000, 1920)).toEqual({ width: 1440, height: 1920 });
  expect(getResizedDimensions(600, 800, 1920)).toEqual({ width: 600, height: 800 });
});
it.each([0, -1, Infinity, NaN])("rejects invalid dimensions %s", (value) => {
  expect(() => getResizedDimensions(value, 800, 1920)).toThrow();
  expect(() => getResizedDimensions(800, value, 1920)).toThrow();
  expect(() => getResizedDimensions(800, 800, value)).toThrow();
});
