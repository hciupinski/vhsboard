import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRentalDocument } from "@/lib/documents/rental-repository";

export function RentalSection() {
  const { data: document } = useQuery({
    queryKey: ["public", "rental-document"],
    queryFn: getRentalDocument,
    enabled: typeof window !== "undefined",
    retry: false,
    refetchInterval: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
  return (
    <section
      className="border-t border-border bg-background py-12 sm:py-14"
      aria-labelledby="rental-heading"
    >
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Wypożyczalnia i serwis
        </p>
        <h2 id="rental-heading" className="mt-3 text-4xl leading-[0.95] sm:text-5xl">
          SPRZĘT GOTOWY NA WYJAZD
        </h2>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-muted-foreground">
          Nie masz własnego sprzętu albo chcesz przygotować deskę na kolejny sezon? W VHS prowadzimy
          wypożyczalnię sprzętu zimowego oraz serwis snowboardów. Znajdziesz u nas deski w różnych
          rozmiarach, buty i kaski renomowanych marek, przede wszystkim Salomon. Pomożemy Ci dobrać
          sprzęt do potrzeb i zadbamy również o Twój własny.
        </p>
        {document ? (
          <Button asChild size="lg" className="mt-6 rounded-full">
            <a href={document.signedUrl} target="_blank" rel="noopener noreferrer">
              Zapoznaj się z ofertą <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
