import { ListField } from "@/components/admin/ListField";
import { SubtitleField } from "./EditorField";
import { errorFor } from "./editor-fields";
export function OfferStorySection({
  paragraphs,
  subtitle,
  isDayCamp,
  errors,
  disabled,
  onParagraphsChange,
  onSubtitleChange,
}: {
  paragraphs: string[];
  subtitle: string;
  isDayCamp: boolean;
  errors: Record<string, string>;
  disabled: boolean;
  onParagraphsChange: (value: string[]) => void;
  onSubtitleChange: (value: string) => void;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
    >
      {isDayCamp ? (
        <SubtitleField
          value={subtitle}
          error={errors["subtitle"]}
          ariaError={errorFor(errors, "subtitle")}
          disabled={disabled}
          onChange={onSubtitleChange}
        />
      ) : null}
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
