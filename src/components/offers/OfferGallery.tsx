import type { OfferImage } from "@/lib/offers/types";

export function OfferGallery({ images }: { images: OfferImage[] }) {
  const visibleImages = images.filter((image) => image.signedUrl !== null);

  if (visibleImages.length === 0) {
    return null;
  }

  return (
    <section className="bg-secondary/60 py-16 sm:py-20" aria-labelledby="offer-gallery-title">
      <div className="mx-auto max-w-6xl px-5">
        <h2 id="offer-gallery-title" className="text-3xl sm:text-4xl">
          Zdjęcia z wyjazdu
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleImages.map((image) => (
            <img
              key={image.id}
              src={image.signedUrl ?? undefined}
              alt={image.alt}
              loading="lazy"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full rounded-2xl object-cover transition-transform duration-300 hover:-translate-y-1 hover:shadow-warm"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
