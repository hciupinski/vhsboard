type EventPlaceholderFigureProps = {
  src: string;
  alt: string;
};

export function EventPlaceholderFigure({ src, alt }: EventPlaceholderFigureProps) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-warm">
      <img src={src} alt={alt} className="aspect-[4/3] w-full object-cover" />
    </figure>
  );
}
