import { describe, expect, it } from "vitest";
import {
  PORTAL_CAROUSEL_IMAGES,
  DEFAULT_PORTAL_CAROUSEL_IMAGES,
  getPortalCarouselImage,
  isPortalCarouselImagePath,
} from "./catalogue";

describe("portal carousel catalogue", () => {
  it("uses all five replacement photos and starts the default carousel with snowboarding", () => {
    expect(DEFAULT_PORTAL_CAROUSEL_IMAGES.map(({ path }) => path)).toEqual([
      "carousel/1karuzela_snb.png",
      "carousel/2karuzela_oboz1.png",
      "carousel/3karuzela_surf.png",
      "carousel/4eventy_karuzela.png",
      "carousel/karuzela_oboz2.png",
    ]);
    expect(
      DEFAULT_PORTAL_CAROUSEL_IMAGES.every(({ src }) => src.startsWith("/images/generated/")),
    ).toBe(true);
  });
  it.each([
    ["carousel/hero-surf.jpg", "carousel/3karuzela_surf.png"],
    ["carousel/hero-surf-3.jpg", "carousel/3karuzela_surf.png"],
    ["carousel/surf_girl.jpg", "carousel/3karuzela_surf.png"],
    ["carousel/wyjazdy.jpg", "carousel/1karuzela_snb.png"],
    ["carousel/obozy-zima.jpg", "carousel/2karuzela_oboz1.png"],
    ["carousel/eventy.jpg", "carousel/4eventy_karuzela.png"],
    ["carousel/skim_main.png", "carousel/4eventy_karuzela.png"],
  ])("resolves saved CMS path %s to its current replacement", (previous, current) => {
    expect(getPortalCarouselImage(previous)).toBe(getPortalCarouselImage(current));
    expect(isPortalCarouselImagePath(previous)).toBe(false);
    expect(isPortalCarouselImagePath(current)).toBe(true);
  });
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
