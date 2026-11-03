import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/admin/form-controls";
import type { DayCampContent, DayCampTerm } from "@/lib/offers/types";
import { EditorField as Field, CharacterCounter } from "./EditorField";
import { errorFor, shouldUpdateDate } from "./editor-fields";

export function DayCampTermsEditor({
  content,
  errors,
  disabled,
  onChange,
}: {
  content: DayCampContent;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (terms: DayCampTerm[]) => void;
}) {
  const update = (termIndex: number, next: DayCampTerm) =>
    onChange(content.terms.map((term, index) => (index === termIndex ? next : term)));
  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div>
        <h2 className="text-xl font-semibold">Turnusy i warianty cen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Każdy turnus ma własny adres zapisów i może mieć kilka wariantów cenowych.
        </p>
      </div>
      {content.terms.map((term, termIndex) => (
        <div
          key={term.id ?? termIndex}
          className="space-y-4 rounded-xl border border-border/60 p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Turnus {termIndex + 1}</h3>
            {content.terms.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || termIndex === 0}
                  onClick={() => {
                    const next = [...content.terms];
                    [next[termIndex - 1], next[termIndex]] = [
                      next[termIndex]!,
                      next[termIndex - 1]!,
                    ];
                    onChange(next);
                  }}
                  aria-label={`Przenieś turnus ${termIndex + 1} wyżej`}
                >
                  Wyżej
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || termIndex === content.terms.length - 1}
                  onClick={() => {
                    const next = [...content.terms];
                    [next[termIndex + 1], next[termIndex]] = [
                      next[termIndex]!,
                      next[termIndex + 1]!,
                    ];
                    onChange(next);
                  }}
                  aria-label={`Przenieś turnus ${termIndex + 1} niżej`}
                >
                  Niżej
                </Button>
              </div>
            ) : null}
            {content.terms.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(content.terms.filter((_, index) => index !== termIndex))}
              >
                <Trash2 className="mr-1 size-4" /> Usuń turnus
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              id={`term-label-${termIndex}`}
              label="Nazwa turnusu"
              characterCount={{ value: term.label, max: 120 }}
              error={errorFor(errors, `content.terms.${termIndex}.label`)}
            >
              <Input
                id={`term-label-${termIndex}`}
                value={term.label}
                maxLength={120}
                onChange={(event) => update(termIndex, { ...term, label: event.target.value })}
              />
            </Field>
            <Field
              id={`term-start-${termIndex}`}
              label="Od"
              error={errorFor(errors, `content.terms.${termIndex}.startDate`)}
            >
              <Input
                id={`term-start-${termIndex}`}
                type="date"
                value={term.startDate}
                onChange={(event) => {
                  if (shouldUpdateDate(event)) {
                    update(termIndex, { ...term, startDate: event.target.value });
                  }
                }}
              />
            </Field>
            <Field
              id={`term-end-${termIndex}`}
              label="Do"
              error={errorFor(errors, `content.terms.${termIndex}.endDate`)}
            >
              <Input
                id={`term-end-${termIndex}`}
                type="date"
                value={term.endDate}
                onChange={(event) => {
                  if (shouldUpdateDate(event)) {
                    update(termIndex, { ...term, endDate: event.target.value });
                  }
                }}
              />
            </Field>
            <div className="sm:col-span-3">
              <Field
                id={`term-booking-url-${termIndex}`}
                label="Adres zapisów"
                error={errorFor(errors, `content.terms.${termIndex}.bookingUrl`)}
              >
                <Input
                  id={`term-booking-url-${termIndex}`}
                  aria-label={`Turnus ${termIndex + 1} — adres zapisów`}
                  type="url"
                  value={term.bookingUrl}
                  placeholder="https://zapisy.example/turnus"
                  onChange={(event) =>
                    update(termIndex, { ...term, bookingUrl: event.target.value })
                  }
                />
              </Field>
            </div>
          </div>
          {term.priceOptions.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className="grid gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-[1fr_8rem_auto]"
            >
              <div className="min-w-0">
                <Input
                  aria-label={`Turnus ${termIndex + 1}, wariant ${optionIndex + 1} — nazwa`}
                  value={option.label}
                  maxLength={120}
                  onChange={(event) =>
                    update(termIndex, {
                      ...term,
                      priceOptions: term.priceOptions.map((item, index) =>
                        index === optionIndex ? { ...item, label: event.target.value } : item,
                      ),
                    })
                  }
                />
                <CharacterCounter value={option.label} max={120} />
              </div>
              <Input
                aria-label={`Turnus ${termIndex + 1}, wariant ${optionIndex + 1} — cena`}
                type="number"
                min={1}
                value={option.price || ""}
                onChange={(event) =>
                  update(termIndex, {
                    ...term,
                    priceOptions: term.priceOptions.map((item, index) =>
                      index === optionIndex ? { ...item, price: Number(event.target.value) } : item,
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Usuń wariant ${optionIndex + 1} z turnusu ${termIndex + 1}`}
                disabled={disabled || term.priceOptions.length === 1}
                onClick={() =>
                  update(termIndex, {
                    ...term,
                    priceOptions: term.priceOptions.filter((_, index) => index !== optionIndex),
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
              update(termIndex, {
                ...term,
                priceOptions: [...term.priceOptions, { label: "", price: 0 }],
              })
            }
          >
            <Plus className="mr-1 size-4" /> Dodaj wariant ceny
          </Button>
        </div>
      ))}
      {content.terms.length < 2 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={disabled}
          onClick={() =>
            onChange([
              ...content.terms,
              {
                label: `Turnus ${content.terms.length + 1}`,
                startDate: "",
                endDate: "",
                bookingUrl: "",
                priceOptions: [{ label: "Cena standardowa", price: 0 }],
              },
            ])
          }
        >
          <Plus className="mr-1 size-4" /> Dodaj turnus
        </Button>
      ) : null}
    </section>
  );
}
