import type { PortalCarouselImage } from "./types";

const modules = import.meta.glob("/src/assets/carousel/*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

export const PORTAL_CAROUSEL_IMAGES: PortalCarouselImage[] = Object.entries(modules)
  .map(([modulePath, src]) => ({
    path: modulePath.replace("/src/assets/", ""),
    src,
    label: modulePath
      .split("/")
      .at(-1)!
      .replace(/\.[^.]+$/, "")
      .replaceAll("-", " "),
  }))
  .sort((left, right) => left.path.localeCompare(right.path));

export const getPortalCarouselImage = (path: string) =>
  PORTAL_CAROUSEL_IMAGES.find((image) => image.path === path);

export const isPortalCarouselImagePath = (path: string) =>
  getPortalCarouselImage(path) !== undefined;
