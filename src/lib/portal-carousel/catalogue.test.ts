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
  });

  it("resolves only a real catalogue entry", () => {
    const firstImage = PORTAL_CAROUSEL_IMAGES[0];
    if (firstImage) expect(getPortalCarouselImage(firstImage.path)?.src).toBeTruthy();
    expect(getPortalCarouselImage("carousel/missing.jpg")).toBeUndefined();
    expect(isPortalCarouselImagePath("https://example.test/x.jpg")).toBe(false);
  });
});
