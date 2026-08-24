import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";

import {
  deleteOfferImage,
  ImageCleanupPendingError,
  listOfferImages,
  reorderOfferImages,
  retryOfferImageObjectCleanup,
  setOfferHeroImage,
  uploadOfferImage,
} from "@/lib/images/repository";
import { validateImageFile } from "@/lib/images/validation";
import type { OfferImage } from "@/lib/offers/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OfferImageManagerProps = {
  offerId: string;
  heroImagePath: string | null;
  disabled: boolean;
  onHeroChanged: (path: string) => void | Promise<void>;
  onImagesChanged: () => void | Promise<void>;
};

const isValidAltText = (altText: string) => {
  const length = altText.trim().length;
  return length >= 5 && length <= 180;
};

const imageActionError = "Nie udało się wykonać tej operacji na zdjęciu. Spróbuj ponownie.";

export function OfferImageManager({
  offerId,
  heroImagePath,
  disabled,
  onHeroChanged,
  onImagesChanged,
}: OfferImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [images, setImages] = useState<OfferImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingCleanupPath, setPendingCleanupPath] = useState<string | null>(null);
  const [isRetryingCleanup, setIsRetryingCleanup] = useState(false);

  const refreshImages = async () => {
    const nextImages = await listOfferImages(offerId);
    setImages([...nextImages].sort((first, second) => first.position - second.position));
  };

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    void listOfferImages(offerId)
      .then((nextImages) => {
        if (isCurrent) {
          setImages([...nextImages].sort((first, second) => first.position - second.position));
          setError(null);
        }
      })
      .catch(() => {
        if (isCurrent) setError("Nie udało się pobrać zdjęć oferty.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [offerId]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Wybierz plik obrazu.");
      return;
    }

    const fileValidation = validateImageFile(selectedFile);
    if (!fileValidation.ok) {
      setError(fileValidation.error.message);
      return;
    }
    if (!isValidAltText(altText)) {
      setError("Opis alternatywny musi mieć od 5 do 180 znaków.");
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      await uploadOfferImage(offerId, selectedFile, altText.trim(), images.length);
      await refreshImages();
      await onImagesChanged();
      setSelectedFile(null);
      setAltText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Nie udało się dodać zdjęcia. Spróbuj ponownie.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetHero = async (image: OfferImage) => {
    setError(null);
    try {
      await setOfferHeroImage(offerId, image.id);
      await onHeroChanged(image.path);
      await onImagesChanged();
    } catch {
      setError("Nie udało się wybrać obrazu głównego. Spróbuj ponownie.");
    }
  };

  const handleMove = async (imageId: string, direction: -1 | 1) => {
    const currentIndex = images.findIndex((image) => image.id === imageId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    const [movedImage] = reordered.splice(currentIndex, 1);
    if (!movedImage) return;
    reordered.splice(targetIndex, 0, movedImage);

    setError(null);
    try {
      await reorderOfferImages(
        offerId,
        reordered.map((image) => image.id),
      );
      setImages(reordered.map((image, position) => ({ ...image, position })));
      await onImagesChanged();
    } catch {
      setError("Nie udało się zmienić kolejności zdjęć. Spróbuj ponownie.");
    }
  };

  const handleDelete = async (image: OfferImage) => {
    if (image.path === heroImagePath) {
      setError("Nie można usunąć obrazu głównego. Najpierw wybierz inny obraz główny.");
      return;
    }

    setError(null);
    setPendingCleanupPath(null);
    try {
      await deleteOfferImage(image.id);
      setImages((current) => current.filter((currentImage) => currentImage.id !== image.id));
      await onImagesChanged();
    } catch (caught) {
      if (caught instanceof ImageCleanupPendingError) {
        setImages((current) => current.filter((currentImage) => currentImage.id !== image.id));
        setPendingCleanupPath(caught.storagePath);
        setError("Obraz usunięto z galerii, ale usunięcie pliku wymaga ponowienia.");
        try {
          await onImagesChanged();
        } catch {
          // The cleanup retry remains available even when cache invalidation is unavailable.
        }
        return;
      }
      setError(imageActionError);
    }
  };

  const handleRetryCleanup = async () => {
    if (!pendingCleanupPath) return;

    setError(null);
    setIsRetryingCleanup(true);
    try {
      await retryOfferImageObjectCleanup(pendingCleanupPath);
      setPendingCleanupPath(null);
    } catch {
      setError("Nie udało się ponowić usunięcia pliku. Spróbuj ponownie.");
    } finally {
      setIsRetryingCleanup(false);
    }
  };

  return (
    <section
      className="space-y-6 rounded-2xl border border-border/70 bg-background p-6"
      aria-label="Zdjęcia oferty"
    >
      <div className="space-y-4 rounded-xl bg-secondary/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary">
            <ImagePlus className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-xl tracking-wide">Dodaj zdjęcie</h2>
            <p className="text-sm text-muted-foreground">
              Plik JPG, PNG lub WebP, maksymalnie 8 MiB.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="image-file">Wybierz plik obrazu</Label>
            <Input
              ref={fileInputRef}
              id="image-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled || isUploading}
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-alt">Opis alternatywny (wymagany)</Label>
            <p id="image-alt-hint" className="text-sm text-muted-foreground">
              Opisz krótko, co przedstawia zdjęcie; od 5 do 180 znaków.
            </p>
            <Input
              id="image-alt"
              value={altText}
              aria-describedby="image-alt-hint"
              disabled={disabled || isUploading}
              onChange={(event) => {
                setAltText(event.target.value);
                setError(null);
              }}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => void handleUpload()}
        >
          {isUploading ? "Dodawanie zdjęcia…" : "Dodaj zdjęcie"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {pendingCleanupPath ? (
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isRetryingCleanup}
          onClick={() => void handleRetryCleanup()}
        >
          {isRetryingCleanup ? "Ponawianie usunięcia…" : "Ponów usunięcie pliku"}
        </Button>
      ) : null}

      <div>
        <h2 className="font-display text-xl tracking-wide">Galeria</h2>
        {isLoading ? <p className="mt-3 text-sm text-muted-foreground">Ładowanie zdjęć…</p> : null}
        {!isLoading && images.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Galeria jest jeszcze pusta.</p>
        ) : null}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2" aria-label="Galeria zdjęć oferty">
          {images.map((image, index) => {
            const isHero = image.path === heroImagePath;
            return (
              <li key={image.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex gap-3">
                  {image.signedUrl ? (
                    <img
                      src={image.signedUrl}
                      alt=""
                      className="size-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="size-20 shrink-0 rounded-lg bg-secondary" aria-hidden="true" />
                  )}
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{image.alt}</p>
                    {isHero ? (
                      <p className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Star className="size-4" aria-hidden="true" /> Obraz główny
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || isHero}
                    onClick={() => void handleSetHero(image)}
                  >
                    Ustaw jako obraz główny
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Przesuń wyżej"
                    disabled={disabled || index === 0}
                    onClick={() => void handleMove(image.id, -1)}
                  >
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Przesuń niżej"
                    disabled={disabled || index === images.length - 1}
                    onClick={() => void handleMove(image.id, 1)}
                  >
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  {isHero ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={disabled}
                      onClick={() => void handleDelete(image)}
                    >
                      <Trash2 aria-hidden="true" /> Usuń zdjęcie
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" size="sm" disabled={disabled}>
                          <Trash2 aria-hidden="true" /> Usuń zdjęcie
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Usunąć zdjęcie z galerii?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ta operacja jest trwała. Zdjęcie zniknie z galerii, a nieużywany plik
                            zostanie usunięty.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void handleDelete(image)}>
                            Usuń zdjęcie
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
