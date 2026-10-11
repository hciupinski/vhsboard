import type { ResponsiveImageAsset } from "../images/responsive";
export type PortalCarouselImage = {
  readonly path: string;
  readonly src: string;
  readonly label: string;
  readonly responsive?: ResponsiveImageAsset;
};
