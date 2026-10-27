"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { OfferImage } from "@/lib/offers/types";

export function OfferGallery({
  images,
  title,
  description,
  id,
}: {
  images: OfferImage[];
  title?: string;
  description?: string;
  id?: string;
}) {
  const visibleImages = images.filter((image) => image.signedUrl !== null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const openingThumbnail = useRef<HTMLButtonElement | null>(null);
  const selectedIndex = visibleImages.findIndex((image) => image.id === selectedId);
  const selectedImage = visibleImages[selectedIndex];
  const hasNavigation = visibleImages.length > 1;

  useEffect(() => {
    if (selectedId !== null && selectedIndex === -1) setSelectedId(null);
  }, [selectedId, selectedIndex]);

  const movePhoto = (direction: number) => {
    if (!hasNavigation || selectedIndex === -1) return;
    const nextIndex = (selectedIndex + direction + visibleImages.length) % visibleImages.length;
    setSelectedId(visibleImages[nextIndex]?.id ?? null);
  };

  if (visibleImages.length === 0) {
    return null;
  }

  const gallery = (
    <div className="mx-auto max-w-6xl px-5">
      {title ? (
        <h2 id={`${id ?? "offer"}-gallery-title`} className="text-3xl sm:text-4xl">
          {title}
        </h2>
      ) : null}
      {description ? <p className="mt-4 max-w-3xl text-muted-foreground">{description}</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleImages.map((image) => (
          <Button
            key={image.id}
            type="button"
            variant="ghost"
            className="group relative block h-auto w-full overflow-hidden rounded-2xl p-0 focus-visible:ring-offset-2"
            aria-label={`Powiększ zdjęcie: ${image.alt}`}
            onClick={(event) => {
              openingThumbnail.current = event.currentTarget;
              setSelectedId(image.id);
            }}
          >
            <img
              src={image.signedUrl ?? undefined}
              alt={image.alt}
              loading="lazy"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full object-cover hover-zoom transition-transform duration-160 ease-out motion-reduce:transition-none"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-end p-4 text-sm font-semibold text-background gallery-shade transition-colors duration-160 motion-reduce:transition-none"
            >
              <span className="gallery-action rounded-full bg-background/90 px-3 py-1.5 text-foreground transition-[opacity,transform] duration-160 ease-out motion-reduce:transition-none">
                Powiększ
              </span>
            </span>
          </Button>
        ))}
      </div>

      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selectedImage ? (
          <DialogContent
            className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-3 border-0 bg-transparent p-0 text-background shadow-none sm:rounded-none [&>button]:right-0 [&>button]:top-0 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-black/70 [&>button]:text-background [&>button]:opacity-100 [&>button]:focus-visible:ring-background [&>button]:focus-visible:ring-offset-black"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              openingThumbnail.current?.focus({ preventScroll: true });
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              movePhoto(event.key === "ArrowLeft" ? -1 : 1);
            }}
          >
            <DialogTitle className="sr-only">{`Powiększone zdjęcie: ${selectedImage.alt}`}</DialogTitle>
            <DialogDescription className="sr-only">
              Pełny widok zdjęcia oferty. Użyj strzałek w lewo i w prawo, aby zmienić zdjęcie.
              Naciśnij Escape, aby zamknąć.
            </DialogDescription>
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="flex h-11 shrink-0 items-center pr-14 text-sm"
            >
              <span className="sr-only">Zdjęcie </span>
              {selectedIndex + 1} / {visibleImages.length}
              <span className="sr-only">: {selectedImage.alt}</span>
            </p>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <img
                src={selectedImage.signedUrl ?? undefined}
                alt={selectedImage.alt}
                width={1600}
                height={1200}
                className="h-auto max-h-full w-auto max-w-full border border-black object-contain"
              />
            </div>
            <div className="flex min-h-11 shrink-0 items-center justify-between gap-3">
              {hasNavigation ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="size-11 shrink-0 rounded-full bg-black/70 p-0 text-background hover:bg-black hover:text-background focus-visible:ring-background focus-visible:ring-offset-black"
                  aria-label="Poprzednie zdjęcie"
                  onClick={() => movePhoto(-1)}
                >
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </Button>
              ) : null}
              <p className="line-clamp-2 flex-1 text-center text-sm">{selectedImage.alt}</p>
              {hasNavigation ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="size-11 shrink-0 rounded-full bg-black/70 p-0 text-background hover:bg-black hover:text-background focus-visible:ring-background focus-visible:ring-offset-black"
                  aria-label="Następne zdjęcie"
                  onClick={() => movePhoto(1)}
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );

  if (!title) {
    return <div className="bg-secondary/60 py-6 sm:pb-10">{gallery}</div>;
  }

  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      className="bg-secondary/60 py-12 sm:py-14"
      aria-labelledby={`${id ?? "offer"}-gallery-title`}
    >
      {gallery}
    </section>
  );
}
