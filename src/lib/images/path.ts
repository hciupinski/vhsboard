import { imageExtensionForMimeType } from "./validation";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const createImagePath = (offerId: string, file: File, id: string): string => {
  if (!uuidPattern.test(offerId) || !uuidPattern.test(id)) {
    throw new Error("Nieprawidłowy identyfikator obrazu.");
  }

  const extension = imageExtensionForMimeType(file.type);
  if (!extension) throw new Error("Nieprawidłowy typ obrazu.");

  return `offers/${offerId}/${id}.${extension}`;
};
