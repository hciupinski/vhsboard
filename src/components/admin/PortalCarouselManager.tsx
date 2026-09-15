import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PORTAL_CAROUSEL_IMAGES } from "@/lib/portal-carousel/catalogue";
import {
  listAdminPortalCarouselImages,
  savePortalCarouselImages,
} from "@/lib/portal-carousel/repository";

const saveError = "Nie udało się zapisać karuzeli. Spróbuj ponownie.";

export function PortalCarouselManager() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void listAdminPortalCarouselImages()
      .then((images) => {
        if (isCurrent) setSelectedPaths(images.map(({ path }) => path));
      })
      .catch(() => {
        if (isCurrent) {
          setLoadFailed(true);
          setError("Nie udało się pobrać karuzeli. Spróbuj ponownie.");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const updateSelection = (path: string, checked: boolean) => {
    setError(null);
    setStatus(null);
    setSelectedPaths((current) => {
      if (!checked) return current.filter((item) => item !== path);
      return current.includes(path) ? current : [...current, path];
    });
  };

  const move = (path: string, direction: -1 | 1) => {
    setError(null);
    setStatus(null);
    setSelectedPaths((current) => {
      const index = current.indexOf(path);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const save = async () => {
    setError(null);
    setStatus(null);
    setIsSaving(true);
    try {
      await savePortalCarouselImages(selectedPaths);
      setStatus("Karuzela została zapisana.");
    } catch {
      setError(saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedImages = selectedPaths.flatMap((path) => {
    const image = PORTAL_CAROUSEL_IMAGES.find((candidate) => candidate.path === path);
    return image ? [image] : [];
  });
  const controlsDisabled = isLoading || isSaving || loadFailed;

  return (
    <section
      aria-label="Karuzela portalu"
      className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
    >
      <div>
        <h2 className="font-display text-2xl tracking-wide">Karuzela portalu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wybierz zdjęcia, ustaw ich kolejność i zapisz zmiany.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="rounded-xl bg-secondary p-3 text-sm font-medium">
          {status}
        </p>
      ) : null}

      <fieldset disabled={controlsDisabled} className="space-y-3">
        <legend className="font-display text-xl tracking-wide">Dostępne zdjęcia</legend>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Ładowanie karuzeli…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PORTAL_CAROUSEL_IMAGES.map((image, index) => {
              const inputId = `portal-carousel-image-${index}`;
              return (
                <div
                  key={image.path}
                  className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                >
                  <Input
                    id={inputId}
                    type="checkbox"
                    className="size-4 shrink-0 cursor-pointer"
                    checked={selectedPaths.includes(image.path)}
                    onChange={(event) => updateSelection(image.path, event.target.checked)}
                  />
                  <img
                    src={image.src}
                    alt=""
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                  <Label htmlFor={inputId} className="cursor-pointer leading-snug">
                    {image.label}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </fieldset>

      <div>
        <h3 className="font-display text-xl tracking-wide">Wybrane zdjęcia</h3>
        {selectedImages.length === 0 && !isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Nie wybrano żadnego zdjęcia.</p>
        ) : null}
        <ol className="mt-3 space-y-3" aria-label="Wybrane zdjęcia karuzeli">
          {selectedImages.map((image, index) => (
            <li
              key={image.path}
              aria-label={image.label}
              className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
            >
              <span className="font-display text-lg text-muted-foreground" aria-hidden="true">
                {index + 1}.
              </span>
              <img src={image.src} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0 flex-1 text-sm font-medium">{image.label}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Przenieś wyżej: ${image.label}`}
                  disabled={isLoading || isSaving || index === 0}
                  onClick={() => move(image.path, -1)}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Przenieś niżej: ${image.label}`}
                  disabled={isLoading || isSaving || index === selectedImages.length - 1}
                  onClick={() => move(image.path, 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Button
        type="button"
        className="rounded-full"
        disabled={controlsDisabled}
        onClick={() => void save()}
      >
        {isSaving ? "Zapisywanie karuzeli…" : "Zapisz karuzelę"}
      </Button>
    </section>
  );
}
