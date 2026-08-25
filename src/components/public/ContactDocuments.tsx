import { useQuery } from "@tanstack/react-query";

import { listPublicContactDocuments } from "@/lib/documents/repository";
import { Button } from "@/components/ui/button";

export function ContactDocuments() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["contact-documents"],
    queryFn: listPublicContactDocuments,
  });

  if (isPending)
    return (
      <p aria-live="polite" className="mt-10 text-sm text-muted-foreground">
        Ładowanie dokumentów…
      </p>
    );
  if (isError)
    return (
      <div role="alert" className="mt-10 rounded-2xl border border-border p-5">
        <p className="text-sm text-muted-foreground">Nie udało się pobrać dokumentów.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 rounded-full"
          onClick={() => void refetch()}
        >
          Spróbuj ponownie
        </Button>
      </div>
    );
  if (!data?.length) return null;

  return (
    <section
      className="mt-12 border-t-2 border-foreground pt-6"
      aria-labelledby="contact-documents-heading"
    >
      <h2 id="contact-documents-heading" className="text-4xl">
        Do pobrania
      </h2>
      <ul className="mt-5 space-y-3 text-lg text-muted-foreground">
        {data.map((document) =>
          document.signedUrl ? (
            <li key={document.id}>
              <a
                href={document.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-1 underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {document.title}
              </a>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
