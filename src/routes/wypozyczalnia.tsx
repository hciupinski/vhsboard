import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { RentalSection } from "@/components/public/RentalSection";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { createPageMetadata } from "@/lib/seo";
import { SOCIAL_IMAGES } from "@/lib/social-images";

export const Route = createFileRoute("/wypozyczalnia")({
  head: () =>
    createPageMetadata({
      socialImage: SOCIAL_IMAGES.trips,
      path: "/wypozyczalnia",
      title: "Wypożyczalnia snowboardów | VHSBOARD",
      description: "Wypożycz snowboard, wiązania i sprzęt dopasowany do Twojego stylu jazdy.",
    }),
  component: RentalPage,
});

function RentalPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/wypozyczalnia" label="Wypożyczalnia snowboardów" />
      <main className="flex-1">
        <RentalSection standalone />
      </main>
      <PublicFooter />
    </div>
  );
}
