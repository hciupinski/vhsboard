import type { ReactNode } from "react";
import type { DayCampContent, TripOfferContent } from "@/lib/offers/types";
import { sectionIsEnabled } from "@/lib/offers/content-v2";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EditorField as Field } from "./EditorField";
import { errorFor } from "./editor-fields";
type Content = DayCampContent | TripOfferContent;
export function OfferAccommodationSection({
  content,
  errors,
  disabled,
  onChange,
  imageManager,
}: {
  content: Content;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (content: Content) => void;
  imageManager?: ReactNode | undefined;
}) {
  return (
    <>
      <AccommodationEditor
        content={content}
        errors={errors}
        disabled={disabled}
        onChange={onChange}
      />
      {imageManager ?? (
        <section className="rounded-2xl border border-border/70 bg-background p-6">
          <p className="text-sm text-muted-foreground">
            Najpierw zapisz szkic, aby dodać zdjęcia zakwaterowania.
          </p>
        </section>
      )}
    </>
  );
}

function AccommodationEditor({
  content,
  errors,
  disabled,
  onChange,
}: {
  content: TripOfferContent | DayCampContent;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (content: TripOfferContent | DayCampContent) => void;
}) {
  const enabled = sectionIsEnabled(content.accommodation);
  const description = content.accommodation?.description ?? "";
  const error = errorFor(errors, "content.accommodation.description");

  return (
    <fieldset
      disabled={disabled}
      className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl tracking-wide">Zakwaterowanie</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Opcjonalna sekcja z opisem miejsca noclegu i osobną galerią zdjęć.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="accommodation-enabled">Włącz sekcję</Label>
          <Switch
            id="accommodation-enabled"
            checked={enabled}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onChange({
                ...content,
                accommodation: { ...content.accommodation, description, enabled: checked },
              })
            }
          />
        </div>
      </div>
      {enabled ? (
        <Field
          id="accommodation-description"
          label="Opis zakwaterowania"
          characterCount={{ value: description, max: 1000 }}
          error={error}
        >
          <Textarea
            id="accommodation-description"
            value={description}
            maxLength={1000}
            className="min-h-32"
            {...(error
              ? { "aria-invalid": true, "aria-describedby": "accommodation-description-error" }
              : {})}
            onChange={(event) =>
              onChange({
                ...content,
                accommodation: { ...content.accommodation, description: event.target.value },
              })
            }
          />
        </Field>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sekcja jest wyłączona i nie będzie widoczna na stronie oferty.
        </p>
      )}
    </fieldset>
  );
}
