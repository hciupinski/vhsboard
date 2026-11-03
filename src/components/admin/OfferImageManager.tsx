import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";

import {
  deleteOfferImage,
  ImageCleanupPendingError,
  ImageRepositoryError,
  listOfferImages,
  reorderOfferImages,
  retryOfferImageObjectCleanup,
  setOfferHeroImage,
  setOfferImageInStory,
  uploadOfferImage,
  updateOfferImageAlt,
} from "@/lib/images/repository";
import { ImageUploadForm } from "./ImageUploadForm";
import type { OfferImage, OfferImageCategory } from "@/lib/offers/types";
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
import { Input } from "@/components/admin/form-controls";
import { Label } from "@/components/ui/label";

type OfferImageManagerProps = {
  offerId: string;
  heroImagePath: string | null;
  disabled: boolean;
  category?: OfferImageCategory;
  onHeroChanged?: (path: string) => void | Promise<void>;
  onImagesChanged: () => void | Promise<void>;
};

const isValidAltText = (altText: string) => {
  const length = altText.trim().length;
  return length >= 5 && length <= 180;
};

const imageActionError = "Nie udało się wykonać tej operacji na zdjęciu. Spróbuj ponownie.";
const imageSyncWarning =
  "Zmiana została zapisana, ale nie udało się odświeżyć widoku. Odśwież stronę.";

const synchronizeImageState = async (
  tasks: Array<() => void | Promise<void>>,
): Promise<boolean> => {
  const results = await Promise.allSettled(
    tasks.map((task) => Promise.resolve().then(() => task())),
  );
  return results.every((result) => result.status === "fulfilled");
};

export function OfferImageManager({
  offerId,
  heroImagePath,
  disabled,
  category = "gallery",
  onHeroChanged,
  onImagesChanged,
}: OfferImageManagerProps) {
  const imageRequestVersion = useRef(0);
  const [images, setImages] = useState<OfferImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGalleryReady, setIsGalleryReady] = useState(false);
  const [isSelectingStory, setIsSelectingStory] = useState(false);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [editedAlt, setEditedAlt] = useState("");
  const [pendingCleanupPath, setPendingCleanupPath] = useState<string | null>(null);
  const [isRetryingCleanup, setIsRetryingCleanup] = useState(false);

  const refreshImages = async () => {
    const requestVersion = ++imageRequestVersion.current;
    const nextImages = await listOfferImages(offerId);
    if (requestVersion === imageRequestVersion.current) {
      setImages(
        nextImages
          .filter((image) => (image.category ?? "gallery") === category)
          .sort((first, second) => first.position - second.position),
      );
    }
  };

  useEffect(() => {
    let isCurrent = true;
    const requestVersion = ++imageRequestVersion.current;
    setIsGalleryReady(false);
    setIsLoading(true);
    void listOfferImages(offerId)
      .then((nextImages) => {
        if (isCurrent && requestVersion === imageRequestVersion.current) {
          setImages(
            nextImages
              .filter((image) => (image.category ?? "gallery") === category)
              .sort((first, second) => first.position - second.position),
          );
          setIsGalleryReady(true);
          setError(null);
        }
      })
      .catch(() => {
        if (isCurrent && requestVersion === imageRequestVersion.current) {
          setError("Nie udało się pobrać zdjęć oferty.");
        }
      })
      .finally(() => {
        if (isCurrent && requestVersion === imageRequestVersion.current) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [offerId, category]);

  const handleUpload = async (selectedFile: File, altText: string): Promise<boolean> => {
    setError(null);
    const nextPosition =
      images.reduce((maximum, image) => Math.max(maximum, image.position), -1) + 1;
    let uploadedImage: OfferImage;
    try {
      uploadedImage =
        category === "gallery"
          ? await uploadOfferImage(offerId, selectedFile, altText.trim(), nextPosition)
          : await uploadOfferImage(offerId, selectedFile, altText.trim(), nextPosition, category);
    } catch (caught) {
      if (caught instanceof ImageCleanupPendingError) {
        setPendingCleanupPath(caught.storagePath);
      }
      if (category === "resort_map" || caught instanceof ImageCleanupPendingError)
        await synchronizeImageState([refreshImages, onImagesChanged]);
      setError(
        caught instanceof ImageRepositoryError
          ? caught.message
          : "Nie udało się dodać zdjęcia. Spróbuj ponownie.",
      );
      return false;
    }

    setImages((current) =>
      (category === "resort_map" ? [uploadedImage] : [...current, uploadedImage]).sort(
        (first, second) => first.position - second.position,
      ),
    );
    const synchronized = await synchronizeImageState([refreshImages, onImagesChanged]);
    if (!synchronized) setError(imageSyncWarning);
    return true;
  };

  const handleSetHero = async (image: OfferImage) => {
    setError(null);
    try {
      await setOfferHeroImage(offerId, image.id);
    } catch {
      setError("Nie udało się wybrać obrazu głównego. Spróbuj ponownie.");
      return;
    }

    const synchronized = await synchronizeImageState([
      () => onHeroChanged?.(image.path),
      onImagesChanged,
    ]);
    if (!synchronized) setError(imageSyncWarning);
  };

  const handleToggleStory = async (image: OfferImage) => {
    setError(null);
    setIsSelectingStory(true);
    try {
      await setOfferImageInStory(offerId, image.id, !image.showInStory);
      await refreshImages();
      await onImagesChanged();
    } catch (caught) {
      setError(
        caught instanceof ImageRepositoryError && caught.message.includes("migracji")
          ? caught.message
          : "Nie udało się zmienić wyboru zdjęcia. Można wybrać maksymalnie trzy.",
      );
      await synchronizeImageState([refreshImages, onImagesChanged]);
    } finally {
      setIsSelectingStory(false);
    }
  };

  const handleSaveAlt = async (image: OfferImage) => {
    if (!isValidAltText(editedAlt)) {
      setError("Opis alternatywny musi mieć od 5 do 180 znaków.");
      return;
    }
    setError(null);
    setIsSelectingStory(true);
    try {
      await updateOfferImageAlt(offerId, image.id, editedAlt);
      setEditingAltId(null);
      await refreshImages();
      await onImagesChanged();
    } catch {
      setError("Nie udało się zmienić opisu zdjęcia. Spróbuj ponownie.");
    } finally {
      setIsSelectingStory(false);
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
      const orderedIds = reordered.map((image) => image.id);
      if (category === "gallery") {
        await reorderOfferImages(offerId, orderedIds);
      } else {
        await reorderOfferImages(offerId, orderedIds, category);
      }
    } catch {
      setError("Nie udało się zmienić kolejności zdjęć. Spróbuj ponownie.");
      return;
    }

    setImages(reordered.map((image, position) => ({ ...image, position })));
    const synchronized = await synchronizeImageState([onImagesChanged]);
    if (!synchronized) setError(imageSyncWarning);
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
      return;
    }

    setImages((current) => current.filter((currentImage) => currentImage.id !== image.id));
    const synchronized = await synchronizeImageState([onImagesChanged]);
    if (!synchronized) setError(imageSyncWarning);
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
      aria-label={
        category === "resort_map"
          ? "Mapa resortu"
          : category === "accommodation"
            ? "Zdjęcia zakwaterowania"
            : "Zdjęcia oferty"
      }
    >
      <ImageUploadForm
        key={`${offerId}-${category}`}
        disabled={disabled || !isGalleryReady}
        onUpload={handleUpload}
        onChange={() => setError(null)}
      />

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
        <h2 className="font-display text-xl tracking-wide">
          {category === "resort_map"
            ? "Mapa tras resortu"
            : category === "accommodation"
              ? "Galeria zakwaterowania"
              : "Galeria"}
        </h2>
        {category === "gallery" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Wybierz maksymalnie trzy zdjęcia do sekcji „O wyjeździe” lub „O obozie”. Kolejność zdjęć
            przy opisie odpowiada kolejności w galerii; pierwsze będzie największe.
          </p>
        ) : null}
        {isLoading ? <p className="mt-3 text-sm text-muted-foreground">Ładowanie zdjęć…</p> : null}
        {!isLoading && images.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Galeria jest jeszcze pusta.</p>
        ) : null}
        <ul
          className="mt-4 grid gap-4 sm:grid-cols-2"
          aria-label={
            category === "resort_map"
              ? "Mapa resortu"
              : category === "accommodation"
                ? "Galeria zdjęć zakwaterowania"
                : "Galeria zdjęć oferty"
          }
        >
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
                {category === "gallery" && editingAltId === image.id ? (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`edit-alt-${image.id}`}>Opis alternatywny</Label>
                    <Input
                      id={`edit-alt-${image.id}`}
                      value={editedAlt}
                      maxLength={180}
                      onChange={(event) => setEditedAlt(event.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={disabled || isSelectingStory}
                      onClick={() => void handleSaveAlt(image)}
                    >
                      Zapisz opis
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingAltId(null)}
                    >
                      Anuluj
                    </Button>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {category === "gallery" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Edytuj opis: ${image.alt}`}
                      disabled={disabled || isSelectingStory}
                      onClick={() => {
                        setEditingAltId(image.id);
                        setEditedAlt(image.alt);
                      }}
                    >
                      Edytuj opis
                    </Button>
                  ) : null}
                  {category === "gallery" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-pressed={!!image.showInStory}
                      aria-label={`Zdjęcie przy opisie: ${image.alt}`}
                      disabled={
                        disabled ||
                        isSelectingStory ||
                        (!image.showInStory &&
                          images.filter((item) => item.showInStory).length >= 3)
                      }
                      onClick={() => void handleToggleStory(image)}
                    >
                      {image.showInStory ? "Usuń z opisu" : "Pokaż przy opisie"}
                    </Button>
                  ) : null}
                  {category === "gallery" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Ustaw jako obraz główny: ${image.alt}`}
                      disabled={disabled || isHero}
                      onClick={() => void handleSetHero(image)}
                    >
                      Ustaw jako obraz główny
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Przesuń wyżej: ${image.alt}`}
                    disabled={disabled || index === 0}
                    onClick={() => void handleMove(image.id, -1)}
                  >
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Przesuń niżej: ${image.alt}`}
                    disabled={disabled || index === images.length - 1}
                    onClick={() => void handleMove(image.id, 1)}
                  >
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  {isHero && category === "gallery" ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      aria-label={`Usuń zdjęcie: ${image.alt}`}
                      disabled={disabled}
                      onClick={() => void handleDelete(image)}
                    >
                      <Trash2 aria-hidden="true" /> Usuń zdjęcie
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          aria-label={`Usuń zdjęcie: ${image.alt}`}
                          disabled={disabled}
                        >
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
