import type { ReactNode } from "react";
export function OfferPhotosSection({
  isTrip,
  heroError,
  imageManager,
}: {
  isTrip: boolean;
  heroError?: string | undefined;
  imageManager?: ReactNode | undefined;
}) {
  return (
    <>
      {isTrip ? (
        <p className="text-sm text-muted-foreground">
          Tutaj zarządzasz galerią i zdjęciem głównym oferty.
        </p>
      ) : null}
      {heroError ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {heroError}
        </p>
      ) : null}
      {imageManager ?? (
        <section className="rounded-2xl border border-border/70 bg-background p-6">
          <p className="text-sm text-muted-foreground">Najpierw zapisz szkic, aby dodać zdjęcia.</p>
        </section>
      )}
    </>
  );
}
