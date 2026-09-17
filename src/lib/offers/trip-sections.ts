import type { TripOffer } from "./types";

export const tripSections = [
  { id: "o-wyjezdzie", label: "O wyjeździe", editorTab: "story" },
  { id: "program", label: "W programie", editorTab: "highlights" },
  { id: "plan-wyjazdu", label: "Plan wyjazdu", editorTab: "days" },
  { id: "w-cenie", label: "Co jest w cenie", editorTab: "inout" },
  { id: "zakwaterowanie", label: "Zakwaterowanie", editorTab: "accommodation" },
  { id: "galeria", label: "Galeria", editorTab: "photos" },
] as const;

export type TripSection = (typeof tripSections)[number];

export function getVisibleTripSections(offer: TripOffer): TripSection[] {
  const { content } = offer;
  const visible = [
    content.paragraphs.length > 0,
    content.highlights.length > 0,
    content.schedule.length > 0,
    content.included.length > 0 || content.excluded.length > 0,
    Boolean(content.accommodation),
    offer.images.some((image) => image.signedUrl !== null),
  ];
  return tripSections.filter((_, index) => visible[index]);
}
