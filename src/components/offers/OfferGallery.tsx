"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { OfferImage } from "@/lib/offers/types";

export function OfferGallery({
  images,
  title = "Zdjęcia z wyjazdu",
}: {
  images: OfferImage[];
  title?: string;
}) {
  const visibleImages = images.filter((image) => image.signedUrl !== null);
  const [selectedImage, setSelectedImage] = useState<OfferImage | null>(null);

  if (visibleImages.length === 0) {
    return null;
  }

  return (
    <section className="bg-secondary/60 py-16 sm:py-20" aria-labelledby="offer-gallery-title">
      <div className="mx-auto max-w-6xl px-5">
        <h2 id="offer-gallery-title" className="text-3xl sm:text-4xl">
          {title}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleImages.map((image) => (
            <Button
              key={image.id}
              type="button"
              variant="ghost"
              className="group relative block h-auto w-full overflow-hidden rounded-2xl p-0 focus-visible:ring-offset-2"
              aria-label={`Powiększ zdjęcie: ${image.alt}`}
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.signedUrl ?? undefined}
                alt={image.alt}
                loading="lazy"
                width={1200}
                height={900}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-end bg-foreground/0 p-4 text-sm font-semibold text-background transition-colors group-hover:bg-foreground/35"
              >
                <span className="translate-y-2 rounded-full bg-background/90 px-3 py-1.5 text-foreground opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  Powiększ
                </span>
              </span>
            </Button>
          ))}
        </div>
      </div>

      <Dialog
        open={selectedImage !== null}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        {selectedImage ? (
          <DialogContent className="w-[calc(100vw-2.5rem)] max-w-5xl border-border/40 bg-foreground p-3 text-background shadow-warm [&>button]:text-background sm:p-4">
            <DialogTitle>{`Powiększone zdjęcie: ${selectedImage.alt}`}</DialogTitle>
            <DialogDescription className="sr-only">
              Pełny widok zdjęcia oferty. Naciśnij Escape, aby zamknąć.
            </DialogDescription>
            <img
              src={selectedImage.signedUrl ?? undefined}
              alt={selectedImage.alt}
              width={1600}
              height={1200}
              className="max-h-[78dvh] w-full rounded-xl object-contain"
            />
            <p className="px-1 text-sm text-background/75">{selectedImage.alt}</p>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}
