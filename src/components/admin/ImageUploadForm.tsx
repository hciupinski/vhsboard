import { useId, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCEPTED_IMAGE_MIME_TYPES, validateImageFile } from "@/lib/images/validation";

type ImageUploadFormProps = {
  disabled?: boolean;
  onUpload: (file: File, altText: string) => Promise<boolean>;
  onChange?: () => void;
};

const validateAlt = (value: string) =>
  value.trim().length >= 5 && value.trim().length <= 180
    ? null
    : "Opis alternatywny musi mieć od 5 do 180 znaków.";
const validateFile = (file: File | null) => {
  if (!file) return "Wybierz plik obrazu.";
  const result = validateImageFile(file);
  return result.ok ? null : result.error.message;
};

/** Reusable upload fields; persistence and category rules belong to the caller. */
export function ImageUploadForm({ disabled = false, onUpload, onChange }: ImageUploadFormProps) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const altInput = useRef<HTMLInputElement>(null);
  const uploadPending = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [altError, setAltError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isDisabled = disabled || isUploading;

  const upload = async () => {
    if (disabled || uploadPending.current) return;
    const nextFileError = validateFile(file);
    const nextAltError = validateAlt(alt);
    setFileError(nextFileError);
    setAltError(nextAltError);
    if (nextFileError || nextAltError) {
      (nextFileError ? fileInput : altInput).current?.focus();
      return;
    }

    uploadPending.current = true;
    setIsUploading(true);
    setUploadError(null);
    try {
      if (await onUpload(file!, alt.trim())) {
        setFile(null);
        setAlt("");
        if (fileInput.current) fileInput.current.value = "";
      }
    } catch {
      setUploadError("Nie udało się dodać zdjęcia. Spróbuj ponownie.");
    } finally {
      uploadPending.current = false;
      setIsUploading(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 rounded-xl bg-secondary/40 p-4" aria-busy={isUploading}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary">
          <ImagePlus className="size-5" aria-hidden="true" />
        </div>
        <h2 className="font-display text-xl tracking-wide">Dodaj zdjęcie</h2>
      </div>
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2 sm:row-span-4 sm:grid-rows-subgrid">
          <Label htmlFor={`${id}-file`}>Wybierz plik obrazu</Label>
          <Input
            ref={fileInput}
            id={`${id}-file`}
            type="file"
            accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
            className="h-11 min-w-0 overflow-hidden px-0 py-0 file:mr-3 file:h-full file:border-r file:border-input file:bg-background file:px-3"
            aria-invalid={!!fileError}
            aria-describedby={`${id}-file-hint${fileError ? ` ${id}-file-error` : ""}`}
            disabled={isDisabled}
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setFile(next);
              setFileError(next ? validateFile(next) : null);
              setUploadError(null);
              onChange?.();
            }}
          />
          <p id={`${id}-file-hint`} className="text-sm text-muted-foreground">
            Plik JPG, PNG lub WebP, maksymalnie 8 MiB.
          </p>
          {fileError ? (
            <p id={`${id}-file-error`} role="alert" className="text-sm text-destructive">
              {fileError}
            </p>
          ) : null}
        </div>
        <div className="grid min-w-0 gap-2 sm:row-span-4 sm:grid-rows-subgrid">
          <Label htmlFor={`${id}-alt`}>Opis alternatywny (wymagany)</Label>
          <Input
            ref={altInput}
            id={`${id}-alt`}
            value={alt}
            className="h-11"
            required
            minLength={5}
            maxLength={180}
            aria-invalid={!!altError}
            aria-describedby={`${id}-alt-hint${altError ? ` ${id}-alt-error` : ""}`}
            disabled={isDisabled}
            onChange={(event) => {
              setAlt(event.target.value);
              if (altError) setAltError(validateAlt(event.target.value));
              setUploadError(null);
              onChange?.();
            }}
          />
          <p id={`${id}-alt-hint`} className="text-sm text-muted-foreground">
            Opisz krótko, co przedstawia zdjęcie; od 5 do 180 znaków.
          </p>
          {altError ? (
            <p id={`${id}-alt-error`} role="alert" className="text-sm text-destructive">
              {altError}
            </p>
          ) : null}
        </div>
      </div>
      {uploadError ? (
        <p role="alert" className="text-sm text-destructive">
          {uploadError}
        </p>
      ) : null}
      <Button type="button" disabled={isDisabled} onClick={() => void upload()}>
        {isUploading ? "Dodawanie zdjęcia…" : "Dodaj zdjęcie"}
      </Button>
    </div>
  );
}
