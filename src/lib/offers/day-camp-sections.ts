import { getOfferEditorSections, getOfferSections, type OfferSection } from "./sections";
import type { DayCampOffer } from "./types";
export const dayCampSections = getOfferEditorSections("day_camp");
export type DayCampSection = OfferSection;
export const getVisibleDayCampSections = (offer: DayCampOffer): DayCampSection[] =>
  getOfferSections(offer);
