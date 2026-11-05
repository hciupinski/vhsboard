import type { ContentSections } from "./content-v2";
export type OfferStatus = "draft" | "published" | "archived";

export type OfferKind = "trip" | "day_camp";

export type TripActivity = "surf" | "snow";
export type DayCampActivity = "wake" | "snow";
export type OfferActivity = TripActivity | DayCampActivity;

export type OfferImageCategory = "gallery" | "accommodation" | "resort_map" | "resort_gallery";

export type AccommodationContent = {
  description: string;
  enabled?: boolean | undefined;
};

export type OfferImage = {
  id: string;
  path: string;
  alt: string;
  position: number;
  category: OfferImageCategory;
  showInStory?: boolean;
  signedUrl: string | null;
};

export type TripOfferContent = ContentSections & {
  paragraphs: string[];
  highlights: string[];
  highlightIcons?: string[] | undefined;
  included: string[];
  excluded: string[];
  schedule: Array<{ day: string; text: string }>;
  accommodation?: AccommodationContent | undefined;
};

export type DayCampPriceOption = {
  label: string;
  price: number;
};

export type DayCampTerm = {
  id?: string | undefined;
  label: string;
  startDate: string;
  endDate: string;
  bookingUrl: string;
  priceOptions: DayCampPriceOption[];
};

export type DayCampContent = ContentSections & {
  paragraphs: string[];
  highlights: string[];
  highlightIcons?: string[] | undefined;
  included: string[];
  excluded: string[];
  dayProgram: Array<{ time: string; text: string }>;
  venueDescription: string;
  parentInfo: {
    ageRange: string;
    supervision: string;
    safety: string;
    transport?: string | undefined;
    meals?: string | undefined;
  };
  terms: DayCampTerm[];
  accommodation?: AccommodationContent | undefined;
};

export type OfferContent = TripOfferContent | DayCampContent;

type PublicOfferBase = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  groupSizeMin: number | null;
  groupSizeMax: number | null;
  priceFrom: number;
  currency: "PLN";
  bookingUrl: string;
  showLastPlacesBadge: boolean;
  heroImageUrl: string | null;
  images: OfferImage[];
  storyImages?: OfferImage[];
  accommodationImages: OfferImage[];
  resortMap?: OfferImage | null;
  resortImages?: OfferImage[];
};

export type TripOffer = PublicOfferBase & {
  offerKind: "trip";
  activity: TripActivity;
  content: TripOfferContent;
};

export type DayCampOffer = PublicOfferBase & {
  offerKind: "day_camp";
  activity: DayCampActivity;
  content: DayCampContent;
};

export type PublicOffer = TripOffer | DayCampOffer;

export type PublishedOfferSeoRecord = {
  slug: string;
  updatedAt: string;
  offerKind: OfferKind;
};
