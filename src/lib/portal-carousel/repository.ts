import { supabase } from "../supabase";
import { getPortalCarouselImage, isPortalCarouselImagePath } from "./catalogue";
import { portalCarouselRowSchema } from "./schema";
import type { PortalCarouselImage } from "./types";

const COLUMNS = "id,image_path,position";

export class PortalCarouselRepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PortalCarouselRepositoryError";
  }
}

const listPortalCarouselImages = async (): Promise<PortalCarouselImage[]> => {
  try {
    const { data, error } = await supabase
      .from("portal_carousel_images")
      .select(COLUMNS)
      .order("position", { ascending: true });
    if (error || !Array.isArray(data)) throw error;

    return portalCarouselRowSchema
      .array()
      .parse(data)
      .sort((left, right) => left.position - right.position)
      .flatMap(({ image_path }) => {
        const image = getPortalCarouselImage(image_path);
        return image ? [image] : [];
      });
  } catch (cause) {
    throw new PortalCarouselRepositoryError("Nie udało się pobrać karuzeli.", { cause });
  }
};

export const listPublicPortalCarouselImages = listPortalCarouselImages;
export const listAdminPortalCarouselImages = listPortalCarouselImages;

export const savePortalCarouselImages = async (paths: string[]): Promise<void> => {
  if (new Set(paths).size !== paths.length)
    throw new PortalCarouselRepositoryError("Kolejność karuzeli zawiera powtórzone zdjęcie.");
  if (!paths.every(isPortalCarouselImagePath))
    throw new PortalCarouselRepositoryError("Zdjęcie karuzeli nie istnieje w repozytorium.");

  try {
    const { error } = await supabase.rpc("set_portal_carousel_images", {
      p_ordered_paths: paths,
    });
    if (error)
      throw new PortalCarouselRepositoryError("Nie udało się zapisać karuzeli.", {
        cause: error,
      });
  } catch (cause) {
    if (cause instanceof PortalCarouselRepositoryError) throw cause;
    throw new PortalCarouselRepositoryError("Nie udało się zapisać karuzeli.", { cause });
  }
};
