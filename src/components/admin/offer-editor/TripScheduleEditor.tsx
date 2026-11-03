import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/admin/form-controls";
import { Textarea } from "@/components/admin/form-controls";
import type { TripOfferContent } from "@/lib/offers/types";
import { EditorField as Field } from "./EditorField";

import type { ContentEditorProps } from "./editor-fields";

export function TripScheduleEditor({
  content,
  errors,
  disabled,
  onChange,
}: ContentEditorProps<TripOfferContent>) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-2xl border border-border/70 bg-background p-6"
    >
      {content.schedule.map((item, index) => (
        <div
          key={index}
          className="grid min-w-0 gap-3 rounded-xl border border-border/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"
        >
          <Field
            id={`schedule-day-${index}`}
            label={`Dzień ${index + 1} — nazwa`}
            error={errors[`content.schedule.${index}.day`]}
          >
            <Input
              id={`schedule-day-${index}`}
              value={item.day}
              onChange={(event) =>
                onChange({
                  ...content,
                  schedule: content.schedule.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, day: event.target.value } : entry,
                  ),
                })
              }
            />
          </Field>
          <div className="min-w-0 flex-1">
            <Field
              id={`schedule-text-${index}`}
              label={`Dzień ${index + 1} — opis`}
              error={errors[`content.schedule.${index}.text`]}
            >
              <Textarea
                id={`schedule-text-${index}`}
                value={item.text}
                onChange={(event) =>
                  onChange({
                    ...content,
                    schedule: content.schedule.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, text: event.target.value } : entry,
                    ),
                  })
                }
              />
            </Field>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Usuń dzień ${index + 1}`}
            disabled={disabled}
            onClick={() =>
              onChange({
                ...content,
                schedule: content.schedule.filter((_, entryIndex) => entryIndex !== index),
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={disabled}
        onClick={() =>
          onChange({
            ...content,
            schedule: [
              ...content.schedule,
              { day: `Część ${content.schedule.length + 1}`, text: "" },
            ],
          })
        }
      >
        <Plus className="mr-1 size-4" /> Dodaj dzień
      </Button>
    </fieldset>
  );
}
