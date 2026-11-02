import { sectionIsEnabled } from "./content-v2";
import type { PublicOffer } from "./types";

export type OfferSection = {
  id: string;
  label: string;
  editorTab:
    | "story"
    | "highlights"
    | "inout"
    | "accommodation"
    | "resort"
    | "training"
    | "transport"
    | "insurance"
    | "photos";
  aliases?: readonly string[];
};
export function getOfferEditorSections(kind: "trip" | "day_camp"): OfferSection[] {
  return [
    {
      id: kind === "trip" ? "o-wyjezdzie" : "o-obozie",
      label: kind === "trip" ? "O wyjeździe" : "O obozie",
      editorTab: "story",
      aliases: kind === "day_camp" ? ["dla-rodzica"] : [],
    },
    {
      id: kind === "trip" ? "program" : "atrakcje",
      label: "W programie",
      editorTab: "highlights",
      aliases: [kind === "trip" ? "plan-wyjazdu" : "plan-dnia"],
    },
    {
      id: "w-cenie",
      label: "Cena",
      editorTab: "inout",
      aliases: kind === "day_camp" ? ["turnusy"] : [],
    },
    { id: "zakwaterowanie", label: "Zakwaterowanie", editorTab: "accommodation" },
    { id: "resort", label: "Resort", editorTab: "resort" },
    { id: "szkolenia", label: "Szkolenia", editorTab: "training" },
    { id: "transport", label: "Transport", editorTab: "transport" },
    { id: "ubezpieczenie", label: "Ubezpieczenie", editorTab: "insurance" },
    { id: "galeria", label: "Galeria", editorTab: "photos" },
  ];
}
export function getOfferSections(offer: PublicOffer): OfferSection[] {
  const content = offer.content;
  return getOfferEditorSections(offer.offerKind).filter((section) => {
    switch (section.editorTab) {
      case "story":
        return content.paragraphs.length > 0 || offer.offerKind === "day_camp";
      case "highlights":
        return (
          content.highlights.length > 0 ||
          ("schedule" in content ? content.schedule.length > 0 : content.dayProgram.length > 0)
        );
      case "inout":
        return (
          content.included.length > 0 ||
          content.excluded.length > 0 ||
          ("terms" in content && content.terms.length > 0)
        );
      case "photos":
        return offer.images.some((image) => image.signedUrl !== null);
      default:
        return sectionIsEnabled(content[section.editorTab]);
    }
  });
}
