export type OfferStatus = "draft" | "published" | "archived";

export type OfferActivity = "surf" | "snow" | "combo";

export type OfferImage = {
  id: string;
  path: string;
  alt: string;
  position: number;
  signedUrl: string | null;
};

export type OfferContent = {
  paragraphs: string[];
  highlights: string[];
  included: string[];
  excluded: string[];
  schedule: Array<{ day: string; text: string }>;
};

export type PublicOffer = {
  id: string;
  slug: string;
  activity: OfferActivity;
  title: string;
  subtitle: string;
  shortDescription: string;
  content: OfferContent;
  location: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  groupSizeMin: number | null;
  groupSizeMax: number | null;
  priceFrom: number;
  currency: "PLN";
  bookingUrl: string;
  heroImageUrl: string | null;
  images: OfferImage[];
};

export type PublishedOfferSeoRecord = {
  slug: string;
  updatedAt: string;
};
