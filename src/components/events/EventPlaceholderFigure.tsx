import { ResponsiveImage } from "@/components/public/ResponsiveImage";
import type { ResponsiveImageAsset } from "@/lib/images/responsive";
type EventPlaceholderFigureProps = {
  image: ResponsiveImageAsset;
  alt: string;
};

export function EventPlaceholderFigure({ image, alt }: EventPlaceholderFigureProps) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-warm">
      <ResponsiveImage
        image={image}
        sizes="(min-width: 1024px) 50vw, 100vw"
        loading="lazy"
        alt={alt}
        className="aspect-[4/3] w-full object-cover"
      />
    </figure>
  );
}
