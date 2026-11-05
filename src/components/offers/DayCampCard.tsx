import type { DayCampOffer } from "@/lib/offers/types";

import { OfferCard } from "./OfferCard";

export function DayCampCard({ offer }: { offer: DayCampOffer }) {
  return <OfferCard offer={offer} alwaysShowAction />;
}
