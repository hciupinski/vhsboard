import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ExtraPrice } from "@/lib/offers/content-v2";
type Card = { id: string; title: string; description: string; price: ExtraPrice };
export function createSectionFields(errors: Record<string, string>, disabled: boolean) {
  const field = (
    path: string,
    label: string,
    value: string,
    change: (value: string) => void,
    max = 120,
    type = "text",
  ) => {
    const id = `offer-${path.replaceAll(".", "-")}`;
    const error = errors[`content.${path}`];
    const props = {
      id,
      value,
      maxLength: max,
      disabled,
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        change(event.target.value),
    };
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {max > 500 && type === "text" ? (
          <Textarea {...props} className="min-h-28" />
        ) : (
          <Input {...props} type={type} />
        )}
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {value.length} / {max}
        </p>
      </div>
    );
  };
  const price = (value: ExtraPrice, change: (price: ExtraPrice) => void, path: string) => (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm font-medium">Informacja cenowa</span>
        <select
          className="h-11 w-full rounded-md border bg-background px-3"
          value={value.kind}
          onChange={(e) =>
            change({ ...value, kind: e.target.value as ExtraPrice["kind"], amount: 0 })
          }
        >
          <option value="included">W cenie wyjazdu</option>
          <option value="extra">Dopłata</option>
        </select>
      </label>
      {value.kind === "extra" ? (
        <>
          <label className="space-y-2">
            <span className="text-sm font-medium">Dopłata (PLN)</span>
            <Input
              type="number"
              min={0}
              max={500000}
              step="0.01"
              value={value.amount}
              onChange={(e) => change({ ...value, amount: Number(e.target.value) })}
            />
            {errors[`content.${path}.amount`] ? (
              <p role="alert" className="text-sm text-destructive">
                {errors[`content.${path}.amount`]}
              </p>
            ) : null}
          </label>
          {field(`${path}.unit`, "Jednostka ceny", value.unit, (unit) =>
            change({ ...value, unit }),
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.from}
              onChange={(e) => change({ ...value, from: e.target.checked })}
            />
            Pokaż „od” przed ceną
          </label>
        </>
      ) : null}
    </div>
  );
  const cards = <T extends Card>(
    items: T[],
    change: (items: T[]) => void,
    create: () => T,
    path: string,
    max: number,
    extras?: (item: T, change: (item: T) => void, index: number) => ReactNode,
  ) => (
    <div className="space-y-5">
      {items.map((item, index) => {
        const update = (next: T) => change(items.map((entry, i) => (i === index ? next : entry)));
        const move = (offset: number) => {
          const next = [...items];
          [next[index], next[index + offset]] = [next[index + offset]!, next[index]!];
          change(next);
        };
        return (
          <fieldset key={item.id} className="space-y-4 rounded-xl border border-border p-4">
            <legend className="px-1 font-semibold">{item.title || `Karta ${index + 1}`}</legend>
            {field(`${path}.${index}.title`, "Nagłówek karty w ofercie", item.title, (title) =>
              update({ ...item, title }),
            )}
            {field(
              `${path}.${index}.description`,
              "Opis karty w ofercie",
              item.description,
              (description) => update({ ...item, description }),
              1500,
            )}
            {price(item.price, (price) => update({ ...item, price }), `${path}.${index}.price`)}
            {extras?.(item, update, index)}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={index === 0}
                onClick={() => move(-1)}
              >
                Wyżej
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={index === items.length - 1}
                onClick={() => move(1)}
              >
                Niżej
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => change(items.filter((_, i) => i !== index))}
              >
                Usuń kartę
              </Button>
            </div>
          </fieldset>
        );
      })}
      {errors[`content.${path}`] ? (
        <p role="alert" className="text-destructive">
          {errors[`content.${path}`]}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={items.length >= max}
        onClick={() => change([...items, create()])}
      >
        Dodaj kartę ({items.length}/{max})
      </Button>
    </div>
  );
  return { field, price, cards };
}
