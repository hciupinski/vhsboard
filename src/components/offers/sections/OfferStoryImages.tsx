import type { OfferImage } from "@/lib/offers/types";

export function OfferStoryImages({ images }: { images: OfferImage[] }) {
  const visible = images.filter((image) => image.signedUrl).slice(0, 3);
  if (!visible.length) return null;

  return (
    <div
      className={`mt-6 grid grid-cols-2 gap-3 sm:gap-4 ${visible.length > 1 ? "sm:aspect-[2/1] sm:auto-rows-fr" : ""}`}
    >
      {visible.map((image, index) => (
        <div
          key={image.id}
          className={`relative overflow-hidden rounded-2xl bg-secondary ${
            index === 0
              ? visible.length === 1
                ? "col-span-2 aspect-[16/9]"
                : "col-span-2 aspect-[16/9] sm:col-span-1 sm:row-span-2 sm:aspect-auto"
              : visible.length === 2
                ? "col-span-2 aspect-[16/9] sm:col-span-1 sm:row-span-2 sm:aspect-auto"
                : "aspect-[4/3] sm:aspect-auto"
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
