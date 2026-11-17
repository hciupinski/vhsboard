import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { RentalSection } from "@/components/public/RentalSection";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { createPageMetadata } from "@/lib/seo";
import { SOCIAL_IMAGES } from "@/lib/social-images";
import { rentalReturn } from "@/lib/offers/rental-return";

export const Route = createFileRoute("/wypozyczalnia")({
  head: () =>
    createPageMetadata({
      socialImage: SOCIAL_IMAGES.trips,
      path: "/wypozyczalnia",
      title: "Wypożyczalnia snowboardów | VHSBOARD",
      description: "Wypożycz snowboard, wiązania i sprzęt dopasowany do Twojego stylu jazdy.",
    }),
  validateSearch: (search: Record<string, unknown>) => ({
    kind: typeof search["kind"] === "string" ? search["kind"] : "",
    slug: typeof search["slug"] === "string" ? search["slug"] : "",
  }),
  component: RentalPage,
});

function RentalPage() {
  const { kind, slug } = Route.useSearch();
  const back = rentalReturn(kind, slug);
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/wypozyczalnia" label="Wypożyczalnia snowboardów" />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <a href={back.href} className="font-semibold text-primary underline underline-offset-4">
            ← {back.label}
          </a>
        </div>
        <RentalSection standalone />
      </main>
      <PublicFooter />
    </div>
  );
}
