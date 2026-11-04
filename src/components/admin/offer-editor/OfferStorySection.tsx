import { ListField } from "@/components/admin/ListField";
import { errorFor } from "./editor-fields";
export function OfferStorySection({
  paragraphs,
  errors,
  disabled,
  onParagraphsChange,
}: {
  paragraphs: string[];
  errors: Record<string, string>;
  disabled: boolean;
  onParagraphsChange: (value: string[]) => void;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
    >
      <ListField
        label="Akapity opisu"
        hint="Jedno pole na akapit"
        multiline
        values={paragraphs}
        placeholder="Opowiedz o tej ofercie…"
        error={errorFor(errors, "content.paragraphs")}
        onChange={onParagraphsChange}
      />
    </fieldset>
  );
}
