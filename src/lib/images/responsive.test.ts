import { expect, it } from "vitest";
import { LOCAL_IMAGE_ASSETS } from "./local-assets.generated";
import { getLocalImage } from "./responsive";

it("returns generated responsive metadata for a known local image", () => {
  expect(getLocalImage("main/eventy-1.jpg")).toBe(LOCAL_IMAGE_ASSETS["main/eventy-1.jpg"]);
});

it("keeps a useful runtime error for invalid paths from untyped callers", () => {
  // @ts-expect-error Untyped JavaScript callers can still pass an invalid path at runtime.
  expect(() => getLocalImage("missing/image.jpg")).toThrow(
    "Brak lokalnego obrazu: missing/image.jpg. Uruchom images:generate.",
  );
});
