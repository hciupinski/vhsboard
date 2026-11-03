import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DayCampContent } from "@/lib/offers/types";
import { CharacterCounter } from "./EditorField";
import { errorFor } from "./editor-fields";

export function DayCampProgramEditor({
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
      className="space-y-8 rounded-2xl border border-border/70 bg-background p-6"
    >
      <div>
        <h2 className="text-xl font-semibold">Plan dnia</h2>
        {content.dayProgram.map((item, index) => (
          <div key={index} className="mt-3 grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
            <div className="min-w-0">
              <Input
                aria-label={`Plan dnia ${index + 1} — godzina`}
                value={item.time}
                placeholder="np. 08:00 lub 09:00–10:00"
                maxLength={120}
                onChange={(event) =>
                  onChange({
                    ...content,
                    dayProgram: content.dayProgram.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, time: event.target.value } : entry,
                    ),
                  })
                }
              />
              <CharacterCounter value={item.time} max={120} />
            </div>
            <div className="min-w-0">
              <Input
                aria-label={`Plan dnia ${index + 1} — opis`}
                value={item.text}
                maxLength={500}
                onChange={(event) =>
                  onChange({
                    ...content,
                    dayProgram: content.dayProgram.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, text: event.target.value } : entry,
                    ),
                  })
                }
              />
              <CharacterCounter value={item.text} max={500} />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
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
        ))}
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
        {errorFor(errors, "content.dayProgram") ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {errorFor(errors, "content.dayProgram")}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
