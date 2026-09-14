import { describe, expect, it } from "vitest";
import {
  PORTAL_CAROUSEL_IMAGES,
  getPortalCarouselImage,
  isPortalCarouselImagePath,
} from "./catalogue";

describe("portal carousel catalogue", () => {
  it("orders repository images by stable path", () => {
    const paths = PORTAL_CAROUSEL_IMAGES.map(({ path }) => path);
    expect(paths).toEqual([...paths].sort((left, right) => left.localeCompare(right)));
    expect(paths.every((path) => path.startsWith("carousel/"))).toBe(true);
    expect(Object.isFrozen(PORTAL_CAROUSEL_IMAGES)).toBe(true);
  });

  it("resolves only a real catalogue entry", () => {
    const firstImage = PORTAL_CAROUSEL_IMAGES[0];
    if (firstImage) {
      const originalPath = firstImage.path;
      try {
        (firstImage as unknown as { path: string }).path = "carousel/missing.jpg";
      } catch {
        // Frozen entries may reject mutation in strict mode.
      }
      expect(firstImage.path).toBe(originalPath);
      expect(getPortalCarouselImage(originalPath)?.src).toBeTruthy();
      expect(getPortalCarouselImage("carousel/missing.jpg")).toBeUndefined();
      expect(isPortalCarouselImagePath("carousel/missing.jpg")).toBe(false);
    }
    expect(isPortalCarouselImagePath("https://example.test/x.jpg")).toBe(false);
  });
});
