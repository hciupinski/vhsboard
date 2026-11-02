import { createSectionFields } from "./SectionFields";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  createOptionalSection,
  emptyPrice,
  sectionIsEnabled,
  type OptionalSectionKey,
} from "@/lib/offers/content-v2";
import type { OfferContent } from "@/lib/offers/types";

const names = {
  accommodation: "Zakwaterowanie",
  resort: "Resort",
  training: "Szkolenia",
  transport: "Transport",
  insurance: "Ubezpieczenie",
};
type Props = {
  sectionKey: Exclude<OptionalSectionKey, "accommodation">;
  content: OfferContent;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (content: OfferContent) => void;
  mapManager?: ReactNode;
};
export function OptionalSectionsEditor({
  sectionKey,
  content,
  errors,
  disabled,
  onChange,
  mapManager,
}: Props) {
  const value = content[sectionKey];
  const enabled = sectionIsEnabled(value);
  const { field, price, cards } = createSectionFields(errors, disabled);
  const baseCard = () => ({
    id: crypto.randomUUID(),
    title: "",
    description: "",
    price: emptyPrice(),
  });
  const resort = content.resort;
  const training = content.training;
  const transport = content.transport;
  const insurance = content.insurance;
  return (
    <fieldset
      disabled={disabled}
      className="space-y-6 rounded-2xl border border-border bg-background p-6"
    >
      <legend className="px-2 font-display text-2xl">{names[sectionKey]}</legend>
      <div className="flex items-center gap-3">
        <Switch
          id={`${sectionKey}-enabled`}
          checked={enabled}
          onCheckedChange={(checked) =>
            onChange({
              ...content,
              [sectionKey]: { ...(value ?? createOptionalSection(sectionKey)), enabled: checked },
            })
          }
        />
        <label htmlFor={`${sectionKey}-enabled`}>Pokaż sekcję w ofercie</label>
      </div>
      {!enabled ? (
        <p className="text-sm text-muted-foreground">
          Sekcja jest wyłączona. Zapisana treść zostanie zachowana.
        </p>
      ) : (
        <>
          {resort && sectionKey === "resort" ? (
            <>
              {field("resort.name", "Resort → Nazwa miejsca", resort.name, (name) =>
                onChange({ ...content, resort: { ...resort, name } }),
              )}
              {field(
                "resort.description",
                "Resort → Opis miejsca",
                resort.description,
                (description) => onChange({ ...content, resort: { ...resort, description } }),
                3000,
              )}
              {field(
                "resort.mapUrl",
                "Resort → Link do oficjalnej mapy (opcjonalnie)",
                resort.mapUrl,
                (mapUrl) => onChange({ ...content, resort: { ...resort, mapUrl } }),
                2048,
                "url",
              )}
              {mapManager}
            </>
          ) : null}
          {training && sectionKey === "training" ? (
            <>
              {field(
                "training.description",
                "Szkolenia → Wstęp",
                training.description,
                (description) => onChange({ ...content, training: { ...training, description } }),
                3000,
              )}
              <h3 className="font-semibold">Szkolenia → Bloki szkolenia</h3>
              {cards(
                training.items,
                (items) => onChange({ ...content, training: { ...training, items } }),
                () => ({ ...baseCard(), level: "", scope: "" }),
                "training.items",
                12,
                (item, update, i) => (
                  <>
                    {field(`training.items.${i}.level`, "Dla kogo / poziom", item.level, (level) =>
                      update({ ...item, level }),
                    )}
                    {field(
                      `training.items.${i}.scope`,
                      "Zakres / liczba zajęć",
                      item.scope,
                      (scope) => update({ ...item, scope }),
                      500,
                    )}
                  </>
                ),
              )}
            </>
          ) : null}
          {transport && sectionKey === "transport" ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Transport → Rodzaj transportu</span>
                <select
                  className="h-11 w-full rounded-md border bg-background px-3"
                  value={transport.type}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      transport: { ...transport, type: e.target.value as typeof transport.type },
                    })
                  }
                >
                  {Object.entries({
                    coach: "Autokar",
                    plane: "Samolot",
                    train: "Pociąg",
                    own: "Dojazd własny",
                    other: "Inny",
                  }).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {transport.type === "other"
                ? field(
                    "transport.customType",
                    "Własna nazwa transportu",
                    transport.customType ?? "",
                    (customType) =>
                      onChange({ ...content, transport: { ...transport, customType } }),
                  )
                : null}
              {field(
                "transport.description",
                "Transport → Opis organizacyjny",
                transport.description,
                (description) => onChange({ ...content, transport: { ...transport, description } }),
                3000,
              )}
              {transport.type !== "own"
                ? transport.journeys.map((journey, i) => {
                    const term =
                      "terms" in content
                        ? content.terms.find((t) => t.id === journey.termId)
                        : undefined;
                    const change = (next: typeof journey) =>
                      onChange({
                        ...content,
                        transport: {
                          ...transport,
                          journeys: transport.journeys.map((j, index) => (index === i ? next : j)),
                        },
                      });
                    return (
                      <fieldset
                        key={journey.termId ?? "trip"}
                        className="space-y-4 rounded-xl border p-4"
                      >
                        <legend>
                          {term ? `Transport → ${term.label}` : "Transport → Wyjazd i powrót"}
                        </legend>
                        <p className="text-sm text-muted-foreground">
                          Godziny lokalne organizatora. Godzinę możesz podać później.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {field(
                            `transport.journeys.${i}.departureDate`,
                            "Data wyjazdu",
                            journey.departureDate,
                            (departureDate) => change({ ...journey, departureDate }),
                            10,
                            "date",
                          )}
                          {field(
                            `transport.journeys.${i}.departureTime`,
                            "Godzina wyjazdu (opcjonalna)",
                            journey.departureTime,
                            (departureTime) => change({ ...journey, departureTime }),
                            5,
                            "time",
                          )}
                          {field(
                            `transport.journeys.${i}.departurePlace`,
                            "Miejsce zbiórki",
                            journey.departurePlace,
                            (departurePlace) => change({ ...journey, departurePlace }),
                          )}
                          {field(
                            `transport.journeys.${i}.returnDate`,
                            "Data powrotu",
                            journey.returnDate,
                            (returnDate) => change({ ...journey, returnDate }),
                            10,
                            "date",
                          )}
                          {field(
                            `transport.journeys.${i}.returnTime`,
                            "Godzina powrotu (opcjonalna)",
                            journey.returnTime,
                            (returnTime) => change({ ...journey, returnTime }),
                            5,
                            "time",
                          )}
                          {field(
                            `transport.journeys.${i}.returnPlace`,
                            "Miejsce powrotu",
                            journey.returnPlace,
                            (returnPlace) => change({ ...journey, returnPlace }),
                          )}
                        </div>
                        {field(
                          `transport.journeys.${i}.note`,
                          "Dodatkowe informacje o godzinach",
                          journey.note,
                          (note) => change({ ...journey, note }),
                          500,
                        )}
                      </fieldset>
                    );
                  })
                : null}
              {errors["content.transport.journeys"] ? (
                <p role="alert" className="text-destructive">
                  {errors["content.transport.journeys"]}
                </p>
              ) : null}
            </>
          ) : null}
          {insurance && sectionKey === "insurance" ? (
            <>
              {field(
                "insurance.description",
                "Ubezpieczenie → Wstęp",
                insurance.description,
                (description) => onChange({ ...content, insurance: { ...insurance, description } }),
                3000,
              )}
              {field(
                "insurance.provider",
                "Nazwa ubezpieczyciela (opcjonalna)",
                insurance.provider,
                (provider) => onChange({ ...content, insurance: { ...insurance, provider } }),
              )}
              {field(
                "insurance.informationUrl",
                "Link do warunków (opcjonalny)",
                insurance.informationUrl,
                (informationUrl) =>
                  onChange({ ...content, insurance: { ...insurance, informationUrl } }),
                2048,
                "url",
              )}
              <h3 className="font-semibold">Ubezpieczenie → Pakiety</h3>
              {cards(
                insurance.packages,
                (packages) => onChange({ ...content, insurance: { ...insurance, packages } }),
                () => ({ ...baseCard(), risks: [] }),
                "insurance.packages",
                6,
                (item, update, index) => (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Zakres ochrony</h4>
                    {item.risks.map((risk, i) => (
                      <div
                        key={risk.id}
                        className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2"
                      >
                        {field(
                          `insurance.packages.${index}.risks.${i}.label`,
                          "Rodzaj ochrony",
                          risk.label,
                          (label) =>
                            update({
                              ...item,
                              risks: item.risks.map((r, n) => (n === i ? { ...r, label } : r)),
                            }),
                        )}
                        {field(
                          `insurance.packages.${index}.risks.${i}.value`,
                          "Suma / opis limitu",
                          risk.value,
                          (value) =>
                            update({
                              ...item,
                              risks: item.risks.map((r, n) => (n === i ? { ...r, value } : r)),
                            }),
                          240,
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            update({ ...item, risks: item.risks.filter((_, n) => n !== i) })
                          }
                        >
                          Usuń zakres
                        </Button>
                      </div>
                    ))}
                    {errors[`content.insurance.packages.${index}.risks`] ? (
                      <p role="alert" className="text-destructive">
                        {errors[`content.insurance.packages.${index}.risks`]}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={item.risks.length >= 12}
                      onClick={() =>
                        update({
                          ...item,
                          risks: [...item.risks, { id: crypto.randomUUID(), label: "", value: "" }],
                        })
                      }
                    >
                      Dodaj zakres ochrony
                    </Button>
                  </div>
                ),
              )}
              <h3 className="font-semibold">Ubezpieczenie → Opcjonalne rozszerzenia</h3>
              {cards(
                insurance.extensions,
                (extensions) => onChange({ ...content, insurance: { ...insurance, extensions } }),
                baseCard,
                "insurance.extensions",
                12,
              )}
            </>
          ) : null}
        </>
      )}
    </fieldset>
  );
}
