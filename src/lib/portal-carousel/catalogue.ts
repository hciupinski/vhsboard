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

export const getPortalCarouselImage = (path: string) =>
  PORTAL_CAROUSEL_IMAGES.find((image) => image.path === path);

export const isPortalCarouselImagePath = (path: string) =>
  getPortalCarouselImage(path) !== undefined;
