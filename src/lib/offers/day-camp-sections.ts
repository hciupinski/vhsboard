import type { DayCampOffer } from "./types";

export const dayCampSections = [
  { id: "o-obozie", label: "O obozie", editorTab: "story" },
  { id: "atrakcje", label: "Atrakcje", editorTab: "highlights" },
  { id: "plan-dnia", label: "Plan dnia", editorTab: "days" },
  { id: "w-cenie", label: "W cenie", editorTab: "inout" },
  { id: "turnusy", label: "Turnusy i ceny", editorTab: "terms" },
  { id: "dla-rodzica", label: "Dla rodzica", editorTab: "parents" },
  { id: "galeria", label: "Galeria", editorTab: "photos" },
] as const;

export type DayCampSection = (typeof dayCampSections)[number];

export function getVisibleDayCampSections(offer: DayCampOffer): DayCampSection[] {
  const { content } = offer;
  const visible = [
    content.paragraphs.length > 0 || content.venueDescription.trim().length > 0,
    content.highlights.length > 0,
    content.dayProgram.length > 0,
    content.included.length > 0 || content.excluded.length > 0,
    content.terms.length > 0,
    Object.values(content.parentInfo).some((value) => value?.trim().length > 0),
    offer.images.some((image) => image.signedUrl !== null),
  ];

  return dayCampSections.filter((_, index) => visible[index]);
}
