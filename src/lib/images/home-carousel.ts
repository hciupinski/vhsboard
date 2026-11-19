import { getLocalImage } from "./responsive";

const pairs = [
  ["carousel/1karuzela_snb.png", "carousel/mobile/1karuzela_snb_mobile_cut.jpg"],
  ["carousel/2karuzela_oboz.png", "carousel/mobile/2karuzela_oboz_mobile_cut.jpg"],
  ["carousel/3karuzela_surf.png", "carousel/mobile/3karuzela_surf_mobile_cut.jpg"],
  ["carousel/4karuzela_skim.png", "carousel/mobile/4karuzela_skim_mobile_cut.jpg"],
] as const;

export const HOME_CAROUSEL_IMAGES = pairs.map(([path, portraitPath]) => {
  const responsive = getLocalImage(path);
  return { path, src: responsive.src, responsive, portrait: getLocalImage(portraitPath) };
});
