import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { ResponsiveImage } from "@/components/public/ResponsiveImage";
import { Button } from "@/components/ui/button";
import { getRentalDocument } from "@/lib/documents/rental-repository";
import { getLocalImage } from "@/lib/images/responsive";

const rentalImage = getLocalImage("rental/snowboard.png");

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
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
        <figure>
          <ResponsiveImage
            sizes="(min-width: 1024px) 50vw, 100vw"
            image={rentalImage}
            alt="Snowboardzista jadący w głębokim śniegu"
            loading="lazy"
            className="h-auto w-full rounded-3xl shadow-warm"
          />
        </figure>
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            DOBRA DESKA, DOBRA JAZDA
          </p>
          <h2 id="rental-heading" className="mt-3 text-4xl leading-[0.95] sm:text-5xl">
            WYPOŻYCZALNIA SNOWBOARDÓW
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Dobrze dobrany sprzęt to podstawa dobrej jazdy! W naszej wypożyczalni znajdziesz
            wyłącznie{" "}
            <strong>
              katalogowe modele desek snowboardowych i wiązań renomowanych marek Salomon Snowboards
              oraz HEAD
            </strong>{" "}
            – damskie, męskie i juniorskie.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Każdy snowboard jest systematycznie serwisowany - ostrzony oraz smarowany!
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Oferujemy sprzęt na różne poziomy zaawansowania i style jazdy – od pierwszych skrętów po
            freestyle i freeride. Sprawdź dostępne modele, długości desek i ceny wynajmu. Pomożemy
            wybrać deskę dopasowaną do Ciebie.
          </p>
          {document ? (
            <Button asChild size="lg" className="mt-8 rounded-full">
              <a href={document.signedUrl} target="_blank" rel="noopener noreferrer">
                Zobacz ofertę i cennik <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
