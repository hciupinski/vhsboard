import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DayCampContent } from "@/lib/offers/types";
import { EditorField as Field } from "./EditorField";
import { errorFor } from "./editor-fields";

export function DayCampParentInfoEditor({
  content,
  errors,
  disabled,
  onChange,
}: {
  content: DayCampContent;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (content: DayCampContent) => void;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="grid gap-4 rounded-2xl border border-border/70 bg-background p-6 sm:grid-cols-2"
    >
      <Field
        id="parent-age-range"
        label="Wiek uczestników"
        characterCount={{ value: content.parentInfo.ageRange, max: 120 }}
        error={errorFor(errors, "content.parentInfo.ageRange")}
      >
        <Input
          id="parent-age-range"
          value={content.parentInfo.ageRange}
          maxLength={120}
          onChange={(event) =>
            onChange({
              ...content,
              parentInfo: { ...content.parentInfo, ageRange: event.target.value },
            })
          }
        />
      </Field>

      <Field
        id="parent-supervision"
        label="Opieka"
        characterCount={{ value: content.parentInfo.supervision, max: 500 }}
        error={errorFor(errors, "content.parentInfo.supervision")}
      >
        <Textarea
          id="parent-supervision"
          value={content.parentInfo.supervision}
          maxLength={500}
          onChange={(event) =>
            onChange({
              ...content,
              parentInfo: { ...content.parentInfo, supervision: event.target.value },
            })
          }
        />
      </Field>
      <Field
        id="parent-safety"
        label="Bezpieczeństwo"
        characterCount={{ value: content.parentInfo.safety, max: 500 }}
        error={errorFor(errors, "content.parentInfo.safety")}
      >
        <Textarea
          id="parent-safety"
          value={content.parentInfo.safety}
          maxLength={500}
          onChange={(event) =>
            onChange({
              ...content,
              parentInfo: { ...content.parentInfo, safety: event.target.value },
            })
          }
        />
      </Field>
      {content.parentInfo.transport !== undefined ? (
        <Field
          id="parent-legacy-transport"
          label="Transport — wcześniejszy opis dla rodzica"
          hint="Widoczny w Dla rodzica, dopóki sekcja Transport jest wyłączona."
          error={errorFor(errors, "content.parentInfo.transport")}
        >
          <Textarea
            id="parent-legacy-transport"
            value={content.parentInfo.transport}
            maxLength={500}
            onChange={(event) =>
              onChange({
                ...content,
                parentInfo: { ...content.parentInfo, transport: event.target.value },
              })
            }
          />
        </Field>
      ) : null}
      <div className="sm:col-span-2">
        <Field
          id="parent-meals"
          label="Wyżywienie"
          hint="Opcjonalnie"
          characterCount={{ value: content.parentInfo.meals ?? "", max: 500 }}
          error={errorFor(errors, "content.parentInfo.meals")}
        >
          <Textarea
            id="parent-meals"
            value={content.parentInfo.meals ?? ""}
            maxLength={500}
            onChange={(event) =>
              onChange({
                ...content,
                parentInfo: { ...content.parentInfo, meals: event.target.value },
              })
            }
          />
        </Field>
      </div>
    </fieldset>
  );
}
