import { getOfferEditorSections, getOfferSections, type OfferSection } from "./sections";
import type { TripOffer } from "./types";
export const tripSections = getOfferEditorSections("trip");
export type TripSection = OfferSection;
export const getVisibleTripSections = (offer: TripOffer): TripSection[] => getOfferSections(offer);
