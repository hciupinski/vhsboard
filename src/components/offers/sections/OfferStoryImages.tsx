import type { OfferImage } from "@/lib/offers/types";

export function OfferStoryImages({ images }: { images: OfferImage[] }) {
  const visible = images.filter((image) => image.signedUrl).slice(0, 3);
  if (!visible.length) return null;

  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 lg:self-start ${visible.length > 1 ? "lg:aspect-[4/3] lg:auto-rows-fr" : ""}`}
    >
      {visible.map((image, index) => (
        <div
          key={image.id}
          className={`relative overflow-hidden rounded-2xl bg-secondary ${
            index === 0
              ? visible.length === 1
                ? "aspect-[16/9] lg:col-span-2"
                : "aspect-[16/9] lg:col-span-1 lg:row-span-2 lg:aspect-auto"
              : visible.length === 2
                ? "aspect-[16/9] lg:col-span-1 lg:row-span-2 lg:aspect-auto"
                : "aspect-[16/9] lg:aspect-auto"
          }`}
        >
          <img
            src={image.signedUrl!}
            alt={image.alt}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
