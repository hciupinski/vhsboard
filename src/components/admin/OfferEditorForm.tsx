import type { ReactNode } from "react";
import { Check, ImagePlus, Plus, Trash2, X } from "lucide-react";

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
import type { EditableOfferInput } from "@/lib/offers/editor-schema";
import type { OfferActivity, OfferContent } from "@/lib/offers/types";

type OfferEditorFormProps = {
  value: EditableOfferInput;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (value: EditableOfferInput) => void;
};

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

const errorFor = (errors: Record<string, string>, path: string) =>
  errors[path] ?? Object.entries(errors).find(([key]) => key.startsWith(`${path}.`))?.[1];

const nullableNumber = (rawValue: string) => (rawValue === "" ? null : Number(rawValue));

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

export function OfferEditorForm({ value, errors, disabled, onChange }: OfferEditorFormProps) {
  const setField = <Key extends keyof EditableOfferInput>(
    key: Key,
    nextValue: EditableOfferInput[Key],
  ) => onChange({ ...value, [key]: nextValue });

  const setContent = <Key extends keyof OfferContent>(key: Key, nextValue: OfferContent[Key]) =>
    onChange({ ...value, content: { ...value.content, [key]: nextValue } });

  const inputState = (path: string, controlId = path.replaceAll(".", "-")) => {
    const error = errorFor(errors, path);
    return {
      "aria-describedby": error ? `${controlId}-error` : undefined,
      "aria-invalid": error ? (true as const) : undefined,
    };
  };

  return (
    <Tabs defaultValue="basics">
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value="basics">Podstawy</TabsTrigger>
        <TabsTrigger value="story">O wyjeździe</TabsTrigger>
        <TabsTrigger value="inout">W cenie i poza</TabsTrigger>
        <TabsTrigger value="days">Dzień po dniu</TabsTrigger>
        <TabsTrigger value="photos">Zdjęcia</TabsTrigger>
      </TabsList>

      <TabsContent value="basics" className="mt-6">
        <fieldset
          disabled={disabled}
          className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="title" label="Tytuł wyjazdu" error={errors.title}>
              <Input
                id="title"
                value={value.title}
                placeholder="Atlantycki tydzień surfingu"
                disabled={disabled}
                {...inputState("title")}
                onChange={(event) => setField("title", event.target.value)}
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
                placeholder="atlantic-surf-week"
                disabled={disabled}
                {...inputState("slug")}
                onChange={(event) => setField("slug", event.target.value)}
              />
            </Field>
            <Field id="activity" label="Rodzaj wyjazdu" error={errors.activity}>
              <Select
                value={value.activity}
                disabled={disabled}
                onValueChange={(activity) => setField("activity", activity as OfferActivity)}
              >
                <SelectTrigger id="activity" {...inputState("activity")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="surf">Surf</SelectItem>
                  <SelectItem value="snow">Snowboard</SelectItem>
                  <SelectItem value="combo">Surf i snowboard</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="location" label="Miejsce" error={errors.location}>
              <Input
                id="location"
                value={value.location}
                placeholder="Ericeira, Portugalia"
                disabled={disabled}
                {...inputState("location")}
                onChange={(event) => setField("location", event.target.value)}
              />
            </Field>
            <Field id="start-date" label="Data rozpoczęcia" error={errors.startDate}>
              <Input
                id="start-date"
                type="date"
                value={value.startDate ?? ""}
                disabled={disabled}
                {...inputState("startDate", "start-date")}
                onChange={(event) => setField("startDate", event.target.value || null)}
              />
            </Field>
            <Field id="end-date" label="Data zakończenia" error={errors.endDate}>
              <Input
                id="end-date"
                type="date"
                value={value.endDate ?? ""}
                disabled={disabled}
                {...inputState("endDate", "end-date")}
                onChange={(event) => setField("endDate", event.target.value || null)}
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
                {...inputState("durationDays", "duration-days")}
                onChange={(event) => setField("durationDays", Number(event.target.value))}
              />
            </Field>
            <Field id="price-from" label="Cena od" error={errors.priceFrom}>
              <div className="flex gap-2">
                <Input
                  id="price-from"
                  type="number"
                  min={0}
                  step={1}
                  value={value.priceFrom}
                  disabled={disabled}
                  {...inputState("priceFrom", "price-from")}
                  onChange={(event) => setField("priceFrom", Number(event.target.value))}
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
            <Field
              id="group-size-min"
              label="Minimalna liczba uczestników"
              error={errors.groupSizeMin}
            >
              <Input
                id="group-size-min"
                type="number"
                min={1}
                max={99}
                value={value.groupSizeMin ?? ""}
                disabled={disabled}
                {...inputState("groupSizeMin", "group-size-min")}
                onChange={(event) => setField("groupSizeMin", nullableNumber(event.target.value))}
              />
            </Field>
            <Field
              id="group-size-max"
              label="Maksymalna liczba uczestników"
              error={errors.groupSizeMax}
            >
              <Input
                id="group-size-max"
                type="number"
                min={1}
                max={99}
                value={value.groupSizeMax ?? ""}
                disabled={disabled}
                {...inputState("groupSizeMax", "group-size-max")}
                onChange={(event) => setField("groupSizeMax", nullableNumber(event.target.value))}
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
              placeholder="Poranne sesje o świcie i szkolenie dla każdego poziomu…"
              className="min-h-24"
              disabled={disabled}
              {...inputState("shortDescription", "short-description")}
              onChange={(event) => setField("shortDescription", event.target.value)}
            />
          </Field>

          <Field id="booking-url" label="Adres rezerwacji TripAhead" error={errors.bookingUrl}>
            <Input
              id="booking-url"
              type="url"
              value={value.bookingUrl}
              placeholder="https://tripahead.example/oferta"
              disabled={disabled}
              {...inputState("bookingUrl", "booking-url")}
              onChange={(event) => setField("bookingUrl", event.target.value)}
            />
          </Field>
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
              {...inputState("subtitle")}
              onChange={(event) => setField("subtitle", event.target.value)}
            />
          </Field>
          <ListField
            label="Akapity opisu"
            hint="Jedno pole na akapit"
            multiline
            values={value.content.paragraphs}
            placeholder="Opowiedz o tym wyjeździe…"
            error={errorFor(errors, "content.paragraphs")}
            onChange={(paragraphs) => setContent("paragraphs", paragraphs)}
          />
          <ListField
            label="Najlepsze momenty"
            values={value.content.highlights}
            placeholder="Dwie prowadzone sesje dziennie"
            error={errorFor(errors, "content.highlights")}
            onChange={(highlights) => setContent("highlights", highlights)}
          />
        </fieldset>
      </TabsContent>

      <TabsContent value="inout" className="mt-6">
        <fieldset
          disabled={disabled}
          className="grid gap-6 rounded-2xl border border-border/70 bg-background p-6 md:grid-cols-2"
        >
          <div className="rounded-xl bg-secondary/40 p-4">
            <p className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide">
              <Check className="size-4 text-primary" aria-hidden="true" /> Co jest w cenie
            </p>
            <ListField
              label="W cenie"
              values={value.content.included}
              placeholder="6 nocy w surf house"
              error={errorFor(errors, "content.included")}
              onChange={(included) => setContent("included", included)}
            />
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide">
              <X className="size-4 text-muted-foreground" aria-hidden="true" /> Poza ceną
            </p>
            <ListField
              label="Poza ceną"
              values={value.content.excluded}
              placeholder="Loty do i z Lizbony"
              error={errorFor(errors, "content.excluded")}
              onChange={(excluded) => setContent("excluded", excluded)}
            />
          </div>
        </fieldset>
      </TabsContent>

      <TabsContent value="days" className="mt-6">
        <fieldset
          disabled={disabled}
          className="space-y-4 rounded-2xl border border-border/70 bg-background p-6"
        >
          {value.content.schedule.map((scheduleItem, index) => {
            const dayPath = `content.schedule.${index}.day`;
            const textPath = `content.schedule.${index}.text`;

            return (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row"
              >
                <Field
                  id={`schedule-day-${index}`}
                  label={`Dzień ${index + 1} — nazwa`}
                  error={errors[dayPath]}
                >
                  <Input
                    id={`schedule-day-${index}`}
                    value={scheduleItem.day}
                    placeholder={`Dzień ${index + 1}`}
                    className="sm:w-40"
                    disabled={disabled}
                    {...inputState(dayPath, `schedule-day-${index}`)}
                    onChange={(event) =>
                      setContent(
                        "schedule",
                        value.content.schedule.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, day: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </Field>
                <div className="min-w-0 flex-1">
                  <Field
                    id={`schedule-text-${index}`}
                    label={`Dzień ${index + 1} — opis`}
                    error={errors[textPath]}
                  >
                    <Textarea
                      id={`schedule-text-${index}`}
                      value={scheduleItem.text}
                      placeholder="Odbiór, zakwaterowanie i kolacja powitalna."
                      className="min-h-20"
                      disabled={disabled}
                      {...inputState(textPath, `schedule-text-${index}`)}
                      onChange={(event) =>
                        setContent(
                          "schedule",
                          value.content.schedule.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, text: event.target.value } : item,
                          ),
                        )
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
                  className="shrink-0 text-muted-foreground hover:text-destructive sm:mt-6"
                  onClick={() =>
                    setContent(
                      "schedule",
                      value.content.schedule.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            );
          })}
          {errors["content.schedule"] ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {errors["content.schedule"]}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={disabled}
            onClick={() =>
              setContent("schedule", [
                ...value.content.schedule,
                { day: `Dzień ${value.content.schedule.length + 1}`, text: "" },
              ])
            }
          >
            <Plus className="mr-1 size-4" aria-hidden="true" /> Dodaj dzień
          </Button>
        </fieldset>
      </TabsContent>

      <TabsContent value="photos" className="mt-6">
        <section className="space-y-4 rounded-2xl border border-border/70 bg-background p-6">
          <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary">
              <ImagePlus className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Gotowość obrazu głównego</p>
              <p className="text-sm text-muted-foreground">
                {value.heroImagePath ? "Obraz główny jest przypisany." : "Brak obrazu głównego."}
              </p>
            </div>
          </div>
          {errors.heroImagePath ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {errors.heroImagePath}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Walidowane przesyłanie i zarządzanie zdjęciami zostanie dodane w Task 060. Ten formularz
            nie zapisuje ręcznie adresów ani ścieżek obrazów.
          </p>
        </section>
      </TabsContent>
    </Tabs>
  );
}
