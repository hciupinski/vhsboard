import { OfferPhotosSection } from "./offer-editor/OfferPhotosSection";
import { OfferAccommodationSection } from "./offer-editor/OfferAccommodationSection";
import { OfferOptionalSection } from "./offer-editor/OfferOptionalSection";
import { OfferPriceSection } from "./offer-editor/OfferPriceSection";
import { OfferProgramSection } from "./offer-editor/OfferProgramSection";
import { OfferStorySection } from "./offer-editor/OfferStorySection";
import { OfferBasicsSection } from "./offer-editor/OfferBasicsSection";
import { DayCampParentInfoEditor } from "./offer-editor/DayCampParentInfoEditor";
import { getOfferEditorSections, type OfferSection } from "@/lib/offers/sections";
import { normalizeOfferContentV2 } from "@/lib/offers/content-v2";
import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EditableOfferInput } from "@/lib/offers/editor-schema";
import type { DayCampContent, OfferContent, TripOfferContent } from "@/lib/offers/types";

type EditorTab = "basics" | OfferSection["editorTab"];

type Props = {
  value: EditableOfferInput;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (value: EditableOfferInput) => void;
  imageManager?: ReactNode | undefined;
  accommodationImageManager?: ReactNode | undefined;
  resortMapManager?: ReactNode | undefined;
};
export function OfferEditorForm({
  value,
  errors,
  disabled,
  onChange,
  imageManager,
  accommodationImageManager,
  resortMapManager,
}: Props) {
  const offerKind = value.offerKind ?? "trip";
  const dayCamp = offerKind === "day_camp" ? (value.content as DayCampContent) : null;
  const trip = offerKind === "trip" ? (value.content as TripOfferContent) : null;
  const set = <K extends keyof EditableOfferInput>(key: K, nextValue: EditableOfferInput[K]) =>
    onChange({ ...value, [key]: nextValue });
  const setDayCamp = (content: DayCampContent) =>
    onChange({ ...value, content: normalizeOfferContentV2(content, offerKind) });
  const setContent = (content: OfferContent) =>
    onChange({ ...value, content: normalizeOfferContentV2(content, offerKind) });
  const tabHasError = (prefix: string) =>
    Object.keys(errors).some((path) => path === prefix || path.startsWith(`${prefix}.`));

  const tabs: { editorTab: EditorTab; label: string }[] = [
    { editorTab: "basics", label: "Dane oferty" },
    ...getOfferEditorSections(offerKind),
  ];
  const tabErrorPaths: Record<EditorTab, string[]> = {
    basics: [
      "offerKind",
      "activity",
      "title",
      "slug",
      "location",
      "shortDescription",
      ...(dayCamp
        ? []
        : [
            "subtitle",
            "startDate",
            "endDate",
            "durationDays",
            "groupSizeMin",
            "groupSizeMax",
            "priceFrom",
            "currency",
            "bookingUrl",
          ]),
    ],
    story: ["content.paragraphs", ...(dayCamp ? ["subtitle"] : [])],
    highlights: ["content.highlights", dayCamp ? "content.dayProgram" : "content.schedule"],
    inout: ["content.included", "content.excluded", "content.terms"],
    parent: ["content.parentInfo"],
    resort: ["content.resort", ...(dayCamp ? ["content.venueDescription"] : [])],
    training: ["content.training"],
    transport: ["content.transport"],
    insurance: ["content.insurance"],
    accommodation: ["content.accommodation"],
    photos: ["heroImagePath"],
  };

  return (
    <Tabs defaultValue="basics" className="min-w-0">
      <TabsList
        aria-label="Sekcje oferty"
        className="flex h-auto w-full max-w-full justify-start overflow-x-auto"
        onFocus={(event) => {
          const tab = event.target;
          if (tab.getAttribute("role") !== "tab") return;
          const scroller = event.currentTarget;
          const bounds = scroller.getBoundingClientRect();
          const tabBounds = tab.getBoundingClientRect();
          if (tabBounds.left < bounds.left) {
            scroller.scrollLeft += tabBounds.left - bounds.left;
          } else if (tabBounds.right > bounds.right) {
            scroller.scrollLeft += tabBounds.right - bounds.right;
          }
        }}
      >
        {tabs.map(({ editorTab, label }) => {
          const hasError = tabErrorPaths[editorTab].some(tabHasError);
          return (
            <TabsTrigger
              key={editorTab}
              value={editorTab}
              className="min-h-11 shrink-0 focus-visible:ring-inset focus-visible:ring-offset-0"
              aria-label={hasError ? `${label} — zawiera błędy` : label}
            >
              {label}
              {hasError ? (
                <span aria-hidden="true" className="ml-1 text-destructive">
                  •
                </span>
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="basics" className="mt-6">
        <OfferBasicsSection value={value} errors={errors} disabled={disabled} onChange={onChange} />
      </TabsContent>

      <TabsContent value="story" className="mt-6">
        <OfferStorySection
          paragraphs={value.content.paragraphs}
          subtitle={value.subtitle}
          isDayCamp={!!dayCamp}
          errors={errors}
          disabled={disabled}
          onParagraphsChange={(next) => setContent({ ...value.content, paragraphs: next })}
          onSubtitleChange={(next) => set("subtitle", next)}
        />
      </TabsContent>
      {dayCamp ? (
        <TabsContent value="parent" className="mt-6">
          <DayCampParentInfoEditor
            content={dayCamp}
            errors={errors}
            disabled={disabled}
            onChange={setDayCamp}
          />
        </TabsContent>
      ) : null}

      {trip || dayCamp ? (
        <TabsContent value="highlights" className="mt-6">
          <OfferProgramSection
            content={value.content}
            offerKind={offerKind}
            errors={errors}
            disabled={disabled}
            onChange={setContent}
          />
        </TabsContent>
      ) : null}

      <TabsContent value="inout" className="mt-6">
        <OfferPriceSection
          content={value.content}
          offerKind={offerKind}
          errors={errors}
          disabled={disabled}
          onChange={setContent}
        />
      </TabsContent>
      {(["resort", "training", "transport", "insurance"] as const).map((key) => (
        <TabsContent key={key} value={key} className="mt-6">
          <OfferOptionalSection
            sectionKey={key}
            content={value.content}
            offerKind={offerKind}
            location={value.location}
            errors={errors}
            disabled={disabled}
            onChange={setContent}
            mapManager={resortMapManager}
          />
        </TabsContent>
      ))}
      <TabsContent value="accommodation" className="mt-6 space-y-4">
        <OfferAccommodationSection
          content={value.content}
          errors={errors}
          disabled={disabled}
          onChange={setContent}
          imageManager={accommodationImageManager}
        />
      </TabsContent>
      <TabsContent value="photos" className="mt-6 space-y-4">
        <OfferPhotosSection
          isTrip={!!trip}
          heroError={errors["heroImagePath"]}
          imageManager={imageManager}
        />
      </TabsContent>
    </Tabs>
  );
}
