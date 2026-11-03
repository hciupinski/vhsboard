import type { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { OptionalSectionsEditor } from "../offer-sections/OptionalSectionsEditor";
import { EditorField as Field } from "./EditorField";
import { errorFor } from "./editor-fields";
import type { DayCampContent, TripOfferContent, OfferKind } from "@/lib/offers/types";
type Content = DayCampContent | TripOfferContent;
type CommonProps = {
  content: Content;
  offerKind: OfferKind;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (content: Content) => void;
};
export function OfferOptionalSection({
  sectionKey: key,
  content,
  offerKind,
  location,
  errors,
  disabled,
  onChange,
  mapManager,
}: CommonProps & {
  sectionKey: "resort" | "training" | "transport" | "insurance";
  location: string;
  mapManager?: ReactNode | undefined;
}) {
  const dayCamp = offerKind === "day_camp" ? (content as DayCampContent) : null;
  return (
    <>
      {key === "resort" &&
      dayCamp &&
      (!dayCamp.resort ||
        !dayCamp.resort.enabled ||
        (dayCamp.venueDescription &&
          dayCamp.venueDescription !== dayCamp.resort.description.slice(0, 500))) ? (
        <div className="mb-6 rounded-2xl border border-border bg-background p-6">
          <Field
            id="venue-description"
            label="Resort → Opis miejsca zajęć"
            characterCount={{ value: dayCamp.venueDescription, max: 500 }}
            error={errorFor(errors, "content.venueDescription")}
          >
            <Textarea
              id="venue-description"
              value={dayCamp.venueDescription}
              maxLength={500}
              disabled={disabled}
              className="min-h-24"
              onChange={(event) => onChange({ ...dayCamp, venueDescription: event.target.value })}
            />
          </Field>
          <p className="mt-2 text-sm text-muted-foreground">
            {dayCamp.resort?.enabled
              ? "Starszy opis miejsca zajęć jest zachowany w sekcji Resort."
              : "Włącz resort poniżej, aby dodać nazwę i mapę miejsca."}
          </p>
        </div>
      ) : null}
      <OptionalSectionsEditor
        sectionKey={key}
        content={content}
        errors={errors}
        disabled={disabled}
        onChange={(content) => {
          if (!dayCamp) return onChange(content);
          const next = content as DayCampContent;
          if (key === "resort" && next.resort) {
            if (!dayCamp.resort && next.resort.enabled) {
              next.resort = {
                ...next.resort,
                name: location,
                description: dayCamp.venueDescription,
              };
            }
            if (
              next.resort.description !== dayCamp.resort?.description &&
              (!dayCamp.venueDescription ||
                !dayCamp.resort ||
                dayCamp.venueDescription === dayCamp.resort.description.slice(0, 500))
            ) {
              next.venueDescription = next.resort.description.slice(0, 500);
            }
          }
          onChange(next);
        }}
        mapManager={mapManager}
      />
    </>
  );
}
