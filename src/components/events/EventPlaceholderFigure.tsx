type EventPlaceholderFigureProps = {
  src: string;
  alt: string;
  caption: string;
};

export function EventPlaceholderFigure({ src, alt, caption }: EventPlaceholderFigureProps) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-warm">
      <img src={src} alt={alt} className="aspect-[4/3] w-full object-cover" />
      <figcaption className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
