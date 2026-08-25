import { useEffect, useRef, useState } from "react";

import {
  deleteContactDocument,
  listAdminContactDocuments,
  uploadContactDocument,
} from "@/lib/documents/repository";
import type { ContactDocument } from "@/lib/documents/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactDocumentManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<ContactDocument[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const next = await listAdminContactDocuments();
    setDocuments(next);
  };

  useEffect(() => {
    void refresh()
      .catch(() => setError("Nie udało się pobrać dokumentów."))
      .finally(() => setIsLoading(false));
  }, []);

  const addDocument = async () => {
    if (!title.trim()) {
      setError("Nazwa dokumentu jest wymagana.");
      return;
    }
    if (!file) {
      setError("Wybierz plik PDF.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await uploadContactDocument(
        title,
        file,
        Math.max(-1, ...documents.map(({ position }) => position)) + 1,
      );
      setTitle("");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
    } catch {
      setError("Nie udało się dodać dokumentu. Spróbuj ponownie.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeDocument = async (document: ContactDocument) => {
    if (!window.confirm(`Usunąć dokument „${document.title}”?`)) return;
    setError(null);
    setIsSaving(true);
    try {
      await deleteContactDocument(document.id);
      await refresh();
    } catch {
      setError("Nie udało się usunąć dokumentu. Spróbuj ponownie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-2xl">Dodaj dokument</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="document-title">Nazwa dokumentu</Label>
            <Input
              id="document-title"
              value={title}
              disabled={isLoading || isSaving}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="document-file">Wybierz plik PDF</Label>
            <Input
              id="document-file"
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              disabled={isLoading || isSaving}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          className="mt-5 rounded-full"
          disabled={isLoading || isSaving}
          onClick={() => void addDocument()}
        >
          Dodaj dokument
        </Button>
      </section>
      <section>
        <h2 className="text-2xl">Zapisane dokumenty</h2>
        {isLoading ? (
          <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
            Ładowanie dokumentów…
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <a
                  href={document.signedUrl ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {document.title}
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => void removeDocument(document)}
                >
                  Usuń
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
