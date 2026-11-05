import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/admin/form-controls";
import { Label } from "@/components/ui/label";
import {
  getRentalDocument,
  removeRentalDocument,
  replaceRentalDocument,
} from "@/lib/documents/rental-repository";

export function RentalDocumentManager() {
  const client = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const document = useQuery({
    queryKey: ["admin", "rental-document"],
    queryFn: getRentalDocument,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (next: File | null) =>
      next ? replaceRentalDocument(next) : removeRentalDocument(),
    onSuccess: async () => {
      setFile(null);
      if (input.current) input.current.value = "";
      setMessage("Zmiany zostały zapisane.");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "rental-document"] }),
        client.invalidateQueries({ queryKey: ["public", "rental-document"] }),
      ]);
    },
  });
  const disabled = document.isLoading || document.isError || mutation.isPending;
  return (
    <section
      aria-labelledby="rental-document-heading"
      className="rounded-2xl border border-border bg-background p-6"
    >
      <h2 id="rental-document-heading" className="font-display text-2xl">
        Oferta wypożyczalni — PDF
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Dokument pojawi się na stronie Wyjazdy w sekcji wypożyczalni. Maksymalny rozmiar: 10 MiB.
      </p>
      {document.isLoading ? <p className="mt-4 text-sm">Ładowanie dokumentu…</p> : null}
      {document.isError ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Nie udało się odczytać dokumentu. Odśwież stronę i spróbuj ponownie.
        </p>
      ) : null}
      {document.data ? (
        <a
          className="mt-4 inline-block text-sm text-primary underline"
          href={document.data.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Otwórz aktualną ofertę
        </a>
      ) : !document.isLoading && !document.isError ? (
        <p className="mt-4 text-sm text-muted-foreground">Nie dodano jeszcze oferty PDF.</p>
      ) : null}
      <div className="mt-5 max-w-md space-y-2">
        <Label htmlFor="rental-pdf">Wybierz plik PDF</Label>
        <Input
          id="rental-pdf"
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setMessage(null);
            mutation.reset();
          }}
        />
      </div>
      {mutation.isError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Nie udało się zapisać dokumentu."}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={disabled || !file}
          onClick={() => {
            if (file) mutation.mutate(file);
          }}
        >
          {mutation.isPending ? "Zapisywanie…" : document.data ? "Zastąp ofertę" : "Dodaj ofertę"}
        </Button>
        {document.data ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => {
              if (window.confirm("Usunąć ofertę wypożyczalni?")) mutation.mutate(null);
            }}
          >
            Usuń ofertę
          </Button>
        ) : null}
      </div>
    </section>
  );
}
