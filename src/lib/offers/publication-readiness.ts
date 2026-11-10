import { sectionIsEnabled } from "./content-v2";
import type { EditableOfferInput } from "./editor-schema";

export type OfferImageReadiness = {
  heroReady: boolean;
  accommodationReady: boolean;
};

export const heroRequired = "Dodaj obraz główny z opisem alternatywnym przed publikacją.";
export const accommodationPhotoRequired = "Dodaj co najmniej jedno zdjęcie zakwaterowania.";
export const publicationContentRequired = "Uzupełnij oznaczone pola przed publikacją.";

export function getOfferImageErrors(
  input: EditableOfferInput,
  readiness: OfferImageReadiness | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.heroImagePath || readiness?.heroReady === false) {
    errors["heroImagePath"] = heroRequired;
  }
  if (sectionIsEnabled(input.content.accommodation) && readiness?.accommodationReady === false) {
    errors["content.accommodation.images"] = accommodationPhotoRequired;
  }
  return errors;
}
