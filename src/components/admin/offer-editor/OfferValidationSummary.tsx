import { ArrowRight } from "lucide-react";

type ValidationTab = {
  label: string;
  count: number;
  detail?: string | undefined;
  onSelect: () => void;
};

export function OfferValidationSummary({ title, tabs }: { title: string; tabs: ValidationTab[] }) {
  if (!tabs.length) return null;

  return (
    <section
      aria-label={title}
      className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-4"
    >
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 grid gap-1">
        {tabs.map(({ label, count, detail, onSelect }) => (
          <li key={label}>
            <button
              type="button"
              onClick={onSelect}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-sm hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span>
                <strong>{label}</strong>
                {" — "}
                {detail ?? (count === 1 ? "1 pole do poprawy" : `Pola do poprawy (${count})`)}
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
