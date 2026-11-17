import type { PublicOffer } from "@/lib/offers/types";
import { HomeOfferCard } from "./HomeOfferCard";

export function HomeOffersList({ offers }: { offers: PublicOffer[] }) {
  return (
    <ul
      aria-label="Najbliższe wyjazdy i obozy"
      className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {offers.map((offer) => (
        <li key={offer.id} className="min-w-0">
          <HomeOfferCard offer={offer} />
        </li>
      ))}
    </ul>
  );
}
