import type { ReactNode } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";

import { ListField } from "@/components/admin/ListField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { changeEditableOfferKind, type EditableOfferInput } from "@/lib/offers/editor-schema";
import type {
  DayCampContent,
  DayCampTerm,
  OfferActivity,
  OfferKind,
  TripOfferContent,
} from "@/lib/offers/types";

type Props = {
  value: EditableOfferInput;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (value: EditableOfferInput) => void;
  imageManager?: ReactNode | undefined;
};
type FieldProps = {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
};
const errorFor = (errors: Record<string, string>, path: string) =>
  errors[path] ?? Object.entries(errors).find(([key]) => key.startsWith(`${path}.`))?.[1];
const nullableNumber = (value: string) => (value === "" ? null : Number(value));

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function OfferEditorForm({ value, errors, disabled, onChange, imageManager }: Props) {
  const offerKind = value.offerKind ?? "trip";
  const dayCamp = offerKind === "day_camp" ? (value.content as DayCampContent) : null;
  const trip = offerKind === "trip" ? (value.content as TripOfferContent) : null;
  const set = <K extends keyof EditableOfferInput>(key: K, nextValue: EditableOfferInput[K]) =>
    onChange({ ...value, [key]: nextValue });
  const state = (path: string, id = path.replaceAll(".", "-")) => {
    const error = errorFor(errors, path);
    return {
      "aria-describedby": error ? `${id}-error` : undefined,
      "aria-invalid": error ? true : undefined,
    };
  };
  const setDayCamp = (content: DayCampContent) => onChange({ ...value, content });
  const setTrip = (content: TripOfferContent) => onChange({ ...value, content });
  const setTerms = (terms: DayCampTerm[]) => dayCamp && setDayCamp({ ...dayCamp, terms });
  const listChange = (
    field: "paragraphs" | "highlights" | "included" | "excluded",
    next: string[],
  ) =>
    dayCamp
      ? setDayCamp({ ...dayCamp, [field]: next })
      : trip && setTrip({ ...trip, [field]: next });

  return (
    <Tabs defaultValue="basics">
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value="basics">Podstawy</TabsTrigger>
        <TabsTrigger value="story">{dayCamp ? "O półkolonii" : "O wyjeździe"}</TabsTrigger>
        <TabsTrigger value="inout">W cenie i poza</TabsTrigger>
        <TabsTrigger value="days">{dayCamp ? "Program i opieka" : "Dzień po dniu"}</TabsTrigger>
        <TabsTrigger value="photos">Zdjęcia</TabsTrigger>
      </TabsList>

      <TabsContent value="basics" className="mt-6">
        <fieldset
          disabled={disabled}
          className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="offer-kind" label="Rodzaj oferty" error={errors.offerKind}>
              <Select
                value={offerKind}
                disabled={disabled}
                onValueChange={(next) =>
                  onChange(changeEditableOfferKind(value, next as OfferKind))
                }
              >
                <SelectTrigger id="offer-kind" {...state("offerKind", "offer-kind")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trip">Wyjazd</SelectItem>
                  <SelectItem value="day_camp">Półkolonie</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              id="title"
              label={dayCamp ? "Tytuł półkolonii" : "Tytuł wyjazdu"}
              error={errors.title}
            >
              <Input
                id="title"
                value={value.title}
                disabled={disabled}
                {...state("title")}
                onChange={(event) => set("title", event.target.value)}
              />
            </Field>
            <Field
              id="slug"
              label="Adres oferty"
              hint="Małe litery, cyfry i łączniki"
              error={errors.slug}
            >
              <Input
                id="slug"
                value={value.slug}
                disabled={disabled}
                {...state("slug")}
                onChange={(event) => set("slug", event.target.value)}
              />
            </Field>
            <Field
              id="activity"
              label={dayCamp ? "Aktywność" : "Rodzaj wyjazdu"}
              error={errors.activity}
            >
              <Select
                value={value.activity}
                disabled={disabled}
                onValueChange={(activity) => set("activity", activity as OfferActivity)}
              >
                <SelectTrigger id="activity" {...state("activity")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayCamp ? (
                    <>
                      <SelectItem value="wake">Wakeboard</SelectItem>
                      <SelectItem value="snow">Snowboard</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="surf">Surf</SelectItem>
                      <SelectItem value="snow">Snowboard</SelectItem>
                      <SelectItem value="combo">Surf i snowboard</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field id="location" label="Miejsce" error={errors.location}>
              <Input
                id="location"
                value={value.location}
                disabled={disabled}
                {...state("location")}
                onChange={(event) => set("location", event.target.value)}
              />
            </Field>
          </div>
          <Field
            id="short-description"
            label="Krótki opis"
            hint="Widoczny na liście ofert"
            error={errors.shortDescription}
          >
            <Textarea
              id="short-description"
              value={value.shortDescription}
              className="min-h-24"
              disabled={disabled}
              {...state("shortDescription", "short-description")}
              onChange={(event) => set("shortDescription", event.target.value)}
            />
          </Field>
          {dayCamp ? (
            <TermsEditor
              content={dayCamp}
              errors={errors}
              disabled={disabled}
              onChange={setTerms}
            />
          ) : (
            <TripBasics value={value} errors={errors} disabled={disabled} set={set} state={state} />
          )}
        </fieldset>
      </TabsContent>

      <TabsContent value="story" className="mt-6">
        <fieldset
          disabled={disabled}
          className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
        >
          <Field
            id="subtitle"
            label="Zdanie wprowadzające"
            hint="Pod tytułem oferty"
            error={errors.subtitle}
          >
            <Textarea
              id="subtitle"
              value={value.subtitle}
              className="min-h-20"
              disabled={disabled}
              {...state("subtitle")}
              onChange={(event) => set("subtitle", event.target.value)}
            />
          </Field>
          <ListField
            label="Akapity opisu"
            hint="Jedno pole na akapit"
            multiline
            values={value.content.paragraphs}
            placeholder="Opowiedz o tej ofercie…"
            error={errorFor(errors, "content.paragraphs")}
            onChange={(next) => listChange("paragraphs", next)}
          />
          <ListField
            label="Najlepsze momenty"
            values={value.content.highlights}
            placeholder="Małe grupy i dużo aktywności"
            error={errorFor(errors, "content.highlights")}
            onChange={(next) => listChange("highlights", next)}
          />
          {dayCamp ? (
            <Field
              id="venue-description"
              label="Opis miejsca zajęć"
              error={errorFor(errors, "content.venueDescription")}
            >
              <Textarea
                id="venue-description"
                value={dayCamp.venueDescription}
                className="min-h-24"
                onChange={(event) =>
                  setDayCamp({ ...dayCamp, venueDescription: event.target.value })
                }
              />
            </Field>
          ) : null}
        </fieldset>
      </TabsContent>

      <TabsContent value="inout" className="mt-6">
        <fieldset
          disabled={disabled}
          className="grid gap-6 rounded-2xl border border-border/70 bg-background p-6 md:grid-cols-2"
        >
          <div className="rounded-xl bg-secondary/40 p-4">
            <p className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide">
              <Check className="size-4 text-primary" /> Co jest w cenie
            </p>
            <ListField
              label="W cenie"
              values={value.content.included}
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
              label="Poza ceną"
              values={value.content.excluded}
              placeholder="Dojazd na miejsce"
              error={errorFor(errors, "content.excluded")}
              onChange={(next) => listChange("excluded", next)}
            />
          </div>
        </fieldset>
      </TabsContent>
      <TabsContent value="days" className="mt-6">
        {trip ? (
          <TripScheduleEditor
            content={trip}
            errors={errors}
            disabled={disabled}
            onChange={setTrip}
          />
        ) : dayCamp ? (
          <DayCampProgramEditor
            content={dayCamp}
            errors={errors}
            disabled={disabled}
            onChange={setDayCamp}
          />
        ) : null}
      </TabsContent>
      <TabsContent value="photos" className="mt-6">
        {imageManager ?? (
          <section className="rounded-2xl border border-border/70 bg-background p-6">
            <p className="text-sm text-muted-foreground">
              Najpierw zapisz szkic, aby dodać zdjęcia.
            </p>
          </section>
        )}
      </TabsContent>
    </Tabs>
  );
}

function TripBasics({
  value,
  errors,
  disabled,
  set,
  state,
}: {
  value: EditableOfferInput;
  errors: Record<string, string>;
  disabled: boolean;
  set: <K extends keyof EditableOfferInput>(key: K, value: EditableOfferInput[K]) => void;
  state: (path: string, id?: string) => Record<string, boolean | string | undefined>;
}) {
  return (
    <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
      <Field id="start-date" label="Data rozpoczęcia" error={errors.startDate}>
        <Input
          id="start-date"
          type="date"
          value={value.startDate ?? ""}
          disabled={disabled}
          {...state("startDate", "start-date")}
          onChange={(event) => set("startDate", event.target.value || null)}
        />
      </Field>
      <Field id="end-date" label="Data zakończenia" error={errors.endDate}>
        <Input
          id="end-date"
          type="date"
          value={value.endDate ?? ""}
          disabled={disabled}
          {...state("endDate", "end-date")}
          onChange={(event) => set("endDate", event.target.value || null)}
        />
      </Field>
      <Field id="duration-days" label="Liczba dni" error={errors.durationDays}>
        <Input
          id="duration-days"
          type="number"
          min={1}
          max={60}
          value={value.durationDays}
          disabled={disabled}
          {...state("durationDays", "duration-days")}
          onChange={(event) => set("durationDays", Number(event.target.value))}
        />
      </Field>
      <Field id="price-from" label="Cena od" error={errors.priceFrom}>
        <div className="flex gap-2">
          <Input
            id="price-from"
            type="number"
            min={0}
            value={value.priceFrom}
            disabled={disabled}
            {...state("priceFrom", "price-from")}
            onChange={(event) => set("priceFrom", Number(event.target.value))}
          />
          <Input
            aria-label="Waluta"
            value={value.currency}
            readOnly
            disabled={disabled}
            className="w-20"
          />
        </div>
      </Field>
      <Field id="group-size-min" label="Minimalna liczba uczestników" error={errors.groupSizeMin}>
        <Input
          id="group-size-min"
          type="number"
          min={1}
          max={99}
          value={value.groupSizeMin ?? ""}
          disabled={disabled}
          {...state("groupSizeMin", "group-size-min")}
          onChange={(event) => set("groupSizeMin", nullableNumber(event.target.value))}
        />
      </Field>
      <Field id="group-size-max" label="Maksymalna liczba uczestników" error={errors.groupSizeMax}>
        <Input
          id="group-size-max"
          type="number"
          min={1}
          max={99}
          value={value.groupSizeMax ?? ""}
          disabled={disabled}
          {...state("groupSizeMax", "group-size-max")}
          onChange={(event) => set("groupSizeMax", nullableNumber(event.target.value))}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field id="booking-url" label="Adres zapisów" error={errors.bookingUrl}>
          <Input
            id="booking-url"
            type="url"
            value={value.bookingUrl}
            placeholder="https://zapisy.example/oferta"
            disabled={disabled}
            {...state("bookingUrl", "booking-url")}
            onChange={(event) => set("bookingUrl", event.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function TermsEditor({
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
          Każdy wariant prowadzi do własnego systemu zapisów.
        </p>
      </div>
      {content.terms.map((term, termIndex) => (
        <div key={termIndex} className="space-y-4 rounded-xl border border-border/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Turnus {termIndex + 1}</h3>
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
              error={errorFor(errors, `content.terms.${termIndex}.label`)}
            >
              <Input
                id={`term-label-${termIndex}`}
                value={term.label}
                onChange={(event) => update(termIndex, { ...term, label: event.target.value })}
              />
            </Field>
            <Field id={`term-start-${termIndex}`} label="Od">
              <Input
                id={`term-start-${termIndex}`}
                type="date"
                value={term.startDate}
                onChange={(event) => update(termIndex, { ...term, startDate: event.target.value })}
              />
            </Field>
            <Field id={`term-end-${termIndex}`} label="Do">
              <Input
                id={`term-end-${termIndex}`}
                type="date"
                value={term.endDate}
                onChange={(event) => update(termIndex, { ...term, endDate: event.target.value })}
              />
            </Field>
          </div>
          {term.priceOptions.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className="grid gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-[1fr_8rem_1fr_auto]"
            >
              <Input
                aria-label={`Turnus ${termIndex + 1}, wariant ${optionIndex + 1} — nazwa`}
                value={option.label}
                onChange={(event) =>
                  update(termIndex, {
                    ...term,
                    priceOptions: term.priceOptions.map((item, index) =>
                      index === optionIndex ? { ...item, label: event.target.value } : item,
                    ),
                  })
                }
              />
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
              <Input
                aria-label={`Turnus ${termIndex + 1}, wariant ${optionIndex + 1} — adres zapisów`}
                type="url"
                value={option.bookingUrl}
                placeholder="https://zapisy.example/turnus"
                onChange={(event) =>
                  update(termIndex, {
                    ...term,
                    priceOptions: term.priceOptions.map((item, index) =>
                      index === optionIndex ? { ...item, bookingUrl: event.target.value } : item,
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
                priceOptions: [...term.priceOptions, { label: "", price: 0, bookingUrl: "" }],
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
                priceOptions: [{ label: "Cena standardowa", price: 0, bookingUrl: "" }],
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

function TripScheduleEditor({
  content,
  errors,
  disabled,
  onChange,
}: {
  content: TripOfferContent;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (content: TripOfferContent) => void;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-2xl border border-border/70 bg-background p-6"
    >
      {content.schedule.map((item, index) => (
        <div key={index} className="flex gap-3 rounded-xl border border-border/60 p-4">
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

function DayCampProgramEditor({
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
            <Input
              aria-label={`Plan dnia ${index + 1} — godzina`}
              value={item.time}
              placeholder="09:00"
              onChange={(event) =>
                onChange({
                  ...content,
                  dayProgram: content.dayProgram.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, time: event.target.value } : entry,
                  ),
                })
              }
            />
            <Input
              aria-label={`Plan dnia ${index + 1} — opis`}
              value={item.text}
              onChange={(event) =>
                onChange({
                  ...content,
                  dayProgram: content.dayProgram.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, text: event.target.value } : entry,
                  ),
                })
              }
            />
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
      <div>
        <h2 className="text-xl font-semibold">Plan zajęć</h2>
        {content.activityPlan.map((item, index) => (
          <div key={index} className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
            <Input
              aria-label={`Plan zajęć ${index + 1} — nazwa`}
              value={item.title}
              onChange={(event) =>
                onChange({
                  ...content,
                  activityPlan: content.activityPlan.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, title: event.target.value } : entry,
                  ),
                })
              }
            />
            <Input
              aria-label={`Plan zajęć ${index + 1} — opis`}
              value={item.text}
              onChange={(event) =>
                onChange({
                  ...content,
                  activityPlan: content.activityPlan.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, text: event.target.value } : entry,
                  ),
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Usuń pozycję planu zajęć ${index + 1}`}
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...content,
                  activityPlan: content.activityPlan.filter(
                    (_, entryIndex) => entryIndex !== index,
                  ),
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
            onChange({
              ...content,
              activityPlan: [...content.activityPlan, { title: "", text: "" }],
            })
          }
        >
          <Plus className="mr-1 size-4" /> Dodaj zajęcia
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="parent-age-range"
          label="Wiek uczestników"
          error={errorFor(errors, "content.parentInfo.ageRange")}
        >
          <Input
            id="parent-age-range"
            value={content.parentInfo.ageRange}
            onChange={(event) =>
              onChange({
                ...content,
                parentInfo: { ...content.parentInfo, ageRange: event.target.value },
              })
            }
          />
        </Field>
        <Field id="parent-transport" label="Transport" hint="Opcjonalnie">
          <Textarea
            id="parent-transport"
            value={content.parentInfo.transport ?? ""}
            onChange={(event) =>
              onChange({
                ...content,
                parentInfo: { ...content.parentInfo, transport: event.target.value },
              })
            }
          />
        </Field>
        <Field
          id="parent-supervision"
          label="Opieka"
          error={errorFor(errors, "content.parentInfo.supervision")}
        >
          <Textarea
            id="parent-supervision"
            value={content.parentInfo.supervision}
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
          error={errorFor(errors, "content.parentInfo.safety")}
        >
          <Textarea
            id="parent-safety"
            value={content.parentInfo.safety}
            onChange={(event) =>
              onChange({
                ...content,
                parentInfo: { ...content.parentInfo, safety: event.target.value },
              })
            }
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="parent-meals" label="Wyżywienie" hint="Opcjonalnie">
            <Textarea
              id="parent-meals"
              value={content.parentInfo.meals ?? ""}
              onChange={(event) =>
                onChange({
                  ...content,
                  parentInfo: { ...content.parentInfo, meals: event.target.value },
                })
              }
            />
          </Field>
        </div>
      </div>
    </fieldset>
  );
}
