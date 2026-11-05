import type { EditableOfferInput } from "@/lib/offers/editor-schema";
import { changeEditableOfferKind } from "@/lib/offers/editor-schema";
import type { OfferKind, OfferActivity } from "@/lib/offers/types";
import { Input } from "@/components/admin/form-controls";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/admin/form-controls";
import { EditorField as Field, SubtitleField } from "./EditorField";
import {
  errorFor,
  fieldState,
  nullableNumber,
  shouldUpdateDate,
  toOfferSlug,
} from "./editor-fields";

export function OfferBasicsSection({
  value,
  errors,
  disabled,
  onChange,
}: {
  value: EditableOfferInput;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (value: EditableOfferInput) => void;
}) {
  const offerKind = value.offerKind ?? "trip";
  const dayCamp = offerKind === "day_camp";
  const trip = !dayCamp;
  const set = <K extends keyof EditableOfferInput>(key: K, nextValue: EditableOfferInput[K]) =>
    onChange({ ...value, [key]: nextValue });
  const state = (path: string, id?: string) => fieldState(errors, path, id);
  return (
    <fieldset
      disabled={disabled}
      className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="offer-kind" label="Rodzaj oferty" error={errors["offerKind"]}>
          <Select
            value={offerKind}
            disabled={disabled}
            onValueChange={(next) => onChange(changeEditableOfferKind(value, next as OfferKind))}
          >
            <SelectTrigger
              className="bg-card"
              id="offer-kind"
              {...state("offerKind", "offer-kind")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trip">Wyjazd</SelectItem>
              <SelectItem value="day_camp">Obozy</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field
          id="title"
          label={dayCamp ? "Tytuł obozów" : "Tytuł wyjazdu"}
          characterCount={{ value: value.title, max: 120 }}
          error={errors["title"]}
        >
          <Input
            id="title"
            value={value.title}
            maxLength={120}
            disabled={disabled}
            {...state("title")}
            onChange={(event) => {
              const title = event.target.value;
              const followsTitle = value.slug === "" || value.slug === toOfferSlug(value.title);
              onChange({
                ...value,
                title,
                slug: followsTitle ? toOfferSlug(title) : value.slug,
              });
            }}
          />
        </Field>
        <Field
          id="slug"
          label="Adres URL oferty"
          hint="Tworzy się z tytułu; możesz go zmienić"
          error={errors["slug"]}
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
          error={errors["activity"]}
        >
          <Select
            value={value.activity}
            disabled={disabled}
            onValueChange={(activity) => set("activity", activity as OfferActivity)}
          >
            <SelectTrigger className="bg-card" id="activity" {...state("activity")}>
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
        <Field
          id="location"
          label="Miejsce"
          characterCount={{ value: value.location, max: 120 }}
          error={errors["location"]}
        >
          <Input
            id="location"
            value={value.location}
            maxLength={120}
            disabled={disabled}
            {...state("location")}
            onChange={(event) => set("location", event.target.value)}
          />
        </Field>
      </div>
      <SubtitleField
        value={value.subtitle}
        error={errors["subtitle"]}
        ariaError={errorFor(errors, "subtitle")}
        disabled={disabled}
        onChange={(next) => set("subtitle", next)}
      />
      <Field
        id="short-description"
        label="Krótki opis"
        hint={dayCamp ? "Hero i kafelek obozu" : "Hero oferty"}
        characterCount={{ value: value.shortDescription, max: 500 }}
        error={errors["shortDescription"]}
      >
        <Textarea
          id="short-description"
          value={value.shortDescription}
          maxLength={500}
          className="min-h-24"
          disabled={disabled}
          {...state("shortDescription", "short-description")}
          onChange={(event) => set("shortDescription", event.target.value)}
        />
      </Field>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="show-last-places-badge">Pokaż tag: Ostatnie miejsca</Label>
          <p className="text-sm text-muted-foreground">
            Tag pojawi się tylko na kafelkach aktywnych ofert.
          </p>
        </div>
        <Switch
          id="show-last-places-badge"
          checked={value.showLastPlacesBadge}
          disabled={disabled}
          onCheckedChange={(checked) => set("showLastPlacesBadge", checked)}
        />
      </div>
      {trip ? (
        <TripBasics value={value} errors={errors} disabled={disabled} set={set} state={state} />
      ) : null}
    </fieldset>
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
      <Field id="start-date" label="Data rozpoczęcia" error={errors["startDate"]}>
        <Input
          id="start-date"
          type="date"
          value={value.startDate ?? ""}
          disabled={disabled}
          {...state("startDate", "start-date")}
          onChange={(event) => {
            if (shouldUpdateDate(event)) set("startDate", event.target.value || null);
          }}
        />
      </Field>
      <Field id="end-date" label="Data zakończenia" error={errors["endDate"]}>
        <Input
          id="end-date"
          type="date"
          value={value.endDate ?? ""}
          disabled={disabled}
          {...state("endDate", "end-date")}
          onChange={(event) => {
            if (shouldUpdateDate(event)) set("endDate", event.target.value || null);
          }}
        />
      </Field>
      <Field id="duration-days" label="Liczba dni" error={errors["durationDays"]}>
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
      <Field id="price-from" label="Cena od" error={errors["priceFrom"]}>
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
      <Field
        id="group-size-min"
        label="Minimalna liczba uczestników"
        error={errors["groupSizeMin"]}
      >
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
      <Field
        id="group-size-max"
        label="Maksymalna liczba uczestników"
        error={errors["groupSizeMax"]}
      >
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
        <Field id="booking-url" label="Adres zapisów" error={errors["bookingUrl"]}>
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
