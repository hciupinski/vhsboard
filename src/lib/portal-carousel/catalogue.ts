import type { PortalCarouselImage } from "./types";
import { LOCAL_IMAGE_ASSETS } from "../images/local-assets.generated";

export const PORTAL_CAROUSEL_IMAGES: ReadonlyArray<PortalCarouselImage> = Object.freeze(
  Object.entries(LOCAL_IMAGE_ASSETS)
    .filter(([path]) => path.startsWith("carousel/"))
    .map(([modulePath, image]) => ({
      path: modulePath,
      src: image.src,
      responsive: image,
      label: modulePath
        .split("/")
        .at(-1)!
        .replace(/\.[^.]+$/, "")
        .replaceAll("-", " "),
    }))
    .map((image) => Object.freeze(image))
    .sort((left, right) => left.path.localeCompare(right.path)),
);

const legacyPaths = new Map([
  ["carousel/hero-surf.jpg", "carousel/3karuzela_surf.png"],
  ["carousel/hero-surf-3.jpg", "carousel/3karuzela_surf.png"],
  ["carousel/surf_girl.jpg", "carousel/3karuzela_surf.png"],
  ["carousel/wyjazdy.jpg", "carousel/1karuzela_snb.png"],
  ["carousel/obozy-zima.jpg", "carousel/2karuzela_oboz1.png"],
  ["carousel/eventy.jpg", "carousel/4eventy_karuzela.png"],
  ["carousel/skim_main.png", "carousel/4eventy_karuzela.png"],
]);

export const getPortalCarouselImage = (path: string) => {
  const currentPath = legacyPaths.get(path) ?? path;
  return PORTAL_CAROUSEL_IMAGES.find((image) => image.path === currentPath);
};

export const isPortalCarouselImagePath = (path: string) =>
  PORTAL_CAROUSEL_IMAGES.some((image) => image.path === path);

export const DEFAULT_PORTAL_CAROUSEL_IMAGES: readonly PortalCarouselImage[] = Object.freeze(
  [
    "carousel/1karuzela_snb.png",
    "carousel/2karuzela_oboz1.png",
    "carousel/3karuzela_surf.png",
    "carousel/4eventy_karuzela.png",
    "carousel/karuzela_oboz2.png",
  ].map((path) => {
    const image = getPortalCarouselImage(path);
    if (!image) throw new Error(`Brak domyślnego zdjęcia karuzeli: ${path}`);
    return image;
  }),
);
