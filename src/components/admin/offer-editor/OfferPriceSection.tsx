import { Check, X } from "lucide-react";
import { PRICE_NOTE_MAX_LENGTH } from "@/lib/offers/content-v2";
import { Textarea } from "@/components/admin/form-controls";
import { EditorField } from "./EditorField";
import { ListField } from "@/components/admin/ListField";
import { DayCampTermsEditor as TermsEditor } from "./DayCampTermsEditor";
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
export function OfferPriceSection({ content, offerKind, errors, disabled, onChange }: CommonProps) {
  const priceNote = content.priceNote ?? "";
  const noteError = errorFor(errors, "content.priceNote");
  const dayCamp = offerKind === "day_camp" ? (content as DayCampContent) : null;
  const setTerms = (terms: DayCampContent["terms"]) => dayCamp && onChange({ ...dayCamp, terms });
  const listChange = (field: "included" | "excluded", next: string[]) =>
    onChange({ ...content, [field]: next });
  return (
    <>
      <fieldset
        disabled={disabled}
        className="grid gap-6 rounded-2xl border border-border/70 bg-background p-6 md:grid-cols-2"
      >
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide">
            <Check className="size-4 text-primary" /> Co jest w cenie
          </p>
          <ListField
            reorderable
            disabled={disabled}
            label="W cenie"
            values={content.included}
            placeholder="Opieka instruktorów"
            error={errorFor(errors, "content.included")}
            onChange={(next) => listChange("included", next)}
          />
        </div>
        <div className="rounded-xl bg-muted p-4">
          <p className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide">
            <X className="size-4 text-muted-foreground" /> Poza ceną
          </p>
          <ListField
            reorderable
            disabled={disabled}
            label="Poza ceną"
            values={content.excluded}
            placeholder="Dojazd na miejsce"
            error={errorFor(errors, "content.excluded")}
            onChange={(next) => listChange("excluded", next)}
          />
        </div>
      </fieldset>
      <div className="mt-4 rounded-2xl border border-border/70 bg-background p-6">
        <EditorField
          id="price-note"
          label="Uwagi do ceny"
          characterCount={{ value: priceNote, max: PRICE_NOTE_MAX_LENGTH }}
          error={noteError}
        >
          <Textarea
            id="price-note"
            value={priceNote}
            maxLength={PRICE_NOTE_MAX_LENGTH}
            disabled={disabled}
            aria-invalid={noteError ? true : undefined}
            aria-describedby={noteError ? "price-note-hint price-note-error" : "price-note-hint"}
            onChange={(event) => onChange({ ...content, priceNote: event.target.value })}
          />
        </EditorField>
        <p id="price-note-hint" className="mt-2 text-sm text-muted-foreground">
          Opcjonalny tekst widoczny pod listami „W cenie” i „Poza ceną” w publicznej ofercie.
        </p>
      </div>
      {dayCamp ? (
        <TermsEditor content={dayCamp} errors={errors} disabled={disabled} onChange={setTerms} />
      ) : null}
    </>
  );
}
