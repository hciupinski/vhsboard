import { LOCAL_IMAGE_ASSETS } from "./local-assets.generated";

export type ResponsiveImageAsset = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly webpSrcSet: string;
  readonly avifSrcSet: string;
};

export function getLocalImage(path: string): ResponsiveImageAsset {
  const image = LOCAL_IMAGE_ASSETS[path];
  if (!image) throw new Error(`Brak lokalnego obrazu: ${path}. Uruchom images:generate.`);
  return image;
}
