import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/admin/form-controls";
import type { DayCampContent } from "@/lib/offers/types";
import { EditorField as Field } from "./EditorField";
import { fieldState } from "./editor-fields";

import type { ContentEditorProps } from "./editor-fields";

export function DayCampProgramEditor({
  content,
  errors,
  disabled,
  onChange,
}: ContentEditorProps<DayCampContent>) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-8 rounded-2xl border border-border/70 bg-background p-6"
    >
      <div>
        <h2 className="text-xl font-semibold">Plan wyjazdu</h2>
        {content.dayProgram.map((item, index) => {
          const update = (patch: Partial<typeof item>) =>
            onChange({
              ...content,
              dayProgram: content.dayProgram.map((entry, entryIndex) =>
                entryIndex === index ? { ...entry, ...patch } : entry,
              ),
            });

          return (
            <div
              key={index}
              className="mt-3 grid items-start gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]"
            >
              {(["time", "text"] as const).map((field) => {
                const path = `content.dayProgram.${index}.${field}`;
                const id = `day-program-${index}-${field}`;
                const isTime = field === "time";
                const max = isTime ? 120 : 500;
                const label = isTime ? "Godzina" : "Opis pozycji";
                return (
                  <Field
                    key={field}
                    id={id}
                    label={label}
                    characterCount={{ value: item[field], max }}
                    error={errors[path]}
                  >
                    <Input
                      id={id}
                      aria-label={`Plan wyjazdu ${index + 1} — ${isTime ? "godzina" : "opis"}`}
                      {...fieldState(errors, path, id)}
                      value={item[field]}
                      placeholder={isTime ? "np. 08:00 lub 09:00–10:00" : undefined}
                      maxLength={max}
                      onChange={(event) => update({ [field]: event.target.value })}
                    />
                  </Field>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sm:mt-6"
                aria-label={`Usuń pozycję planu dnia ${index + 1}`}
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...content,
                    dayProgram: content.dayProgram.filter((_, entryIndex) => entryIndex !== index),
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 rounded-full"
          disabled={disabled}
          onClick={() =>
            onChange({ ...content, dayProgram: [...content.dayProgram, { time: "", text: "" }] })
          }
        >
          <Plus className="mr-1 size-4" /> Dodaj pozycję
        </Button>
        {errors["content.dayProgram"] ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {errors["content.dayProgram"]}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
