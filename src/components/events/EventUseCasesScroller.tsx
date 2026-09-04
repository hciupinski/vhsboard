type EventUseCasesScrollerProps = {
  items: readonly string[];
};

export function EventUseCasesScroller({ items }: EventUseCasesScrollerProps) {
  return (
    <ul
      aria-label="Zastosowania toru skimboardowego"
      tabIndex={0}
      className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      {items.map((item) => (
        <li
          key={item}
          className="min-w-64 snap-start rounded-2xl border border-border bg-card p-5 text-lg"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
