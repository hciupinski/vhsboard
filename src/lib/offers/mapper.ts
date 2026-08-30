import {
  offerDetailRowSchema,
  offerImageRowSchema,
  offerListRowSchema,
  type OfferImageRow,
  type OfferListRow,
} from "./schema";
import type {
  DayCampContent,
  OfferContent,
  OfferImage,
  PublicOffer,
  TripOfferContent,
} from "./types";

const emptyContent: TripOfferContent = {
  paragraphs: [],
  highlights: [],
  included: [],
  excluded: [],
  schedule: [],
};

const emptyDayCampContent: DayCampContent = {
  paragraphs: [],
  highlights: [],
  included: [],
  excluded: [],
  dayProgram: [],
  venueDescription: "",
  parentInfo: { ageRange: "", supervision: "", safety: "" },
  terms: [],
};

const toSignedUrlOrNull = (path: string | null, signedUrls: Map<string, string>): string | null => {
  if (path === null) {
    return null;
  }

  const signedUrl = signedUrls.get(path);
  if (!signedUrl) {
    return null;
  }

  try {
    return new URL(signedUrl).protocol === "https:" ? signedUrl : null;
  } catch {
    return null;
  }
};

const validateGroupSize = (offer: OfferListRow): void => {
  if (
    offer.group_size_min !== null &&
    offer.group_size_max !== null &&
    offer.group_size_min > offer.group_size_max
  ) {
    throw new Error("Minimalna liczebność grupy nie może przekraczać maksymalnej.");
  }
};

const validateImageOrder = (images: OfferImageRow[], offerId: string): void => {
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    if (!image) {
      continue;
    }
    if (image.offer_id !== offerId) {
      throw new Error("Galeria zawiera obraz należący do innej oferty.");
    }
    const previousImage = index > 0 ? images[index - 1] : undefined;
    if (previousImage && previousImage.position >= image.position) {
      throw new Error("Pozycje obrazów muszą być rosnące i unikalne.");
    }
  }
};

const toOfferImages = (images: OfferImageRow[], signedUrls: Map<string, string>): OfferImage[] =>
  images.map((image) => ({
    id: image.id,
    path: image.storage_path,
    alt: image.alt_text,
    position: image.position,
    signedUrl: toSignedUrlOrNull(image.storage_path, signedUrls),
  }));

const mapOffer = (
  row: OfferListRow,
  content: OfferContent,
  images: OfferImage[],
  signedUrls: Map<string, string>,
): PublicOffer => {
  validateGroupSize(row);

  const base = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    shortDescription: row.short_description,
    content,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    durationDays: row.duration_days,
    groupSizeMin: row.group_size_min,
    groupSizeMax: row.group_size_max,
    priceFrom: row.price_from,
    currency: row.currency,
    bookingUrl: row.booking_url,
    heroImageUrl: toSignedUrlOrNull(row.hero_image, signedUrls),
    images,
  };

  if (row.offer_kind === "day_camp") {
    if (row.activity !== "wake" && row.activity !== "snow")
      throw new Error("Aktywność nie pasuje do obozów.");
    return {
      ...base,
      offerKind: "day_camp" as const,
      activity: row.activity,
      content: content as DayCampContent,
    };
  }

  if (row.activity !== "surf" && row.activity !== "snow" && row.activity !== "combo")
    throw new Error("Aktywność nie pasuje do wyjazdu.");
  return {
    ...base,
    offerKind: "trip" as const,
    activity: row.activity,
    content: content as TripOfferContent,
  };
};

export const mapOfferListRow = (row: unknown, signedUrls: Map<string, string>): PublicOffer => {
  const parsedRow = offerListRowSchema.parse(row);

  return mapOffer(
    parsedRow,
    parsedRow.offer_kind === "day_camp" ? emptyDayCampContent : emptyContent,
    [],
    signedUrls,
  );
};

export const mapOfferDetailRow = (
  row: unknown,
  imageRows: unknown,
  signedUrls: Map<string, string>,
): PublicOffer => {
  const parsedRow = offerDetailRowSchema.parse(row);
  const parsedImages = offerImageRowSchema.array().parse(imageRows);
  validateImageOrder(parsedImages, parsedRow.id);

  return mapOffer(
    parsedRow,
    parsedRow.description,
    toOfferImages(parsedImages, signedUrls),
    signedUrls,
  );
};
