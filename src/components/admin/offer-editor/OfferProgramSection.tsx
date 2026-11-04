import { arrayMove } from "@dnd-kit/sortable";
import {
  DEFAULT_HIGHLIGHT_ICON,
  HIGHLIGHT_ICONS,
  getHighlightIcon,
} from "@/lib/offers/highlight-icons";
import { ListField } from "@/components/admin/ListField";
import { errorFor } from "./editor-fields";
import { TripScheduleEditor } from "./TripScheduleEditor";
import { DayCampProgramEditor } from "./DayCampProgramEditor";
import type { DayCampContent, TripOfferContent, OfferKind } from "@/lib/offers/types";
type Content = DayCampContent | TripOfferContent;
type CommonProps = {
  content: Content;
  offerKind: OfferKind;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (content: Content) => void;
};
export function OfferProgramSection({
  content,
  offerKind,
  errors,
  disabled,
  onChange,
}: CommonProps) {
  const dayCamp = offerKind === "day_camp" ? (content as DayCampContent) : null;
  const trip = offerKind === "trip" ? (content as TripOfferContent) : null;
  const label = trip ? "W programie" : "Atrakcje";
  const icons = content.highlights.map(
    (_, index) => getHighlightIcon(content.highlightIcons?.[index]).value,
  );
  return (
    <>
      <fieldset
        disabled={disabled}
        className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
      >
        <ListField
          reorderable
          disabled={disabled}
          label={label}
          values={trip?.highlights ?? dayCamp?.highlights ?? []}
          placeholder="Małe grupy i dużo aktywności"
          error={errorFor(errors, "content.highlights")}
          renderExtra={(index) => (
            <select
              aria-label={`Ikona: ${label} ${index + 1}`}
              className="h-10 min-w-32 rounded-md border border-input bg-card px-2 text-sm"
              disabled={disabled}
              value={icons[index] ?? DEFAULT_HIGHLIGHT_ICON}
              onChange={(event) =>
                onChange({
                  ...content,
                  highlightIcons: icons.map((icon, i) => (i === index ? event.target.value : icon)),
                })
              }
            >
              {HIGHLIGHT_ICONS.map((icon) => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </select>
          )}
          onChange={(next, change) => {
            if (!content.highlightIcons) {
              onChange({ ...content, highlights: next });
              return;
            }
            let nextIcons = icons;
            if (change.type === "move") nextIcons = arrayMove(icons, change.from, change.to);
            if (change.type === "remove")
              nextIcons = icons.filter((_, index) => index !== change.index);
            if (change.type === "add") nextIcons = [...icons, DEFAULT_HIGHLIGHT_ICON];
            onChange({ ...content, highlights: next, highlightIcons: nextIcons });
          }}
        />
      </fieldset>
      <h2 className="mt-6 font-display text-2xl">
        W programie → {trip ? "Plan wyjazdu" : "Plan dnia"}
      </h2>
      {trip ? (
        <TripScheduleEditor
          content={trip}
          errors={errors}
          disabled={disabled}
          onChange={onChange}
        />
      ) : dayCamp ? (
        <DayCampProgramEditor
          content={dayCamp}
          errors={errors}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
    </>
  );
}
