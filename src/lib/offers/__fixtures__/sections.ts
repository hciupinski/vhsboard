import { emptyJourney, emptyPrice } from "../content-v2";
import type { PublicOffer, OfferKind } from "../types";

export function sectionOffer(kind: OfferKind = "trip"): PublicOffer {
  const termId = "90000000-0000-4000-8000-000000000011";
  const price = { ...emptyPrice(), kind: "extra" as const, amount: 125.5, from: true };
  const content = {
    schemaVersion: 2 as const,
    paragraphs: ["Wspólny wyjazd na deskę w górach."],
    highlights: ["Jazda w małej ekipie"],
    included: ["Opieka instruktora"],
    excluded: ["Wydatki osobiste"],
    accommodation: { enabled: true, description: "Pensjonat blisko wyciągu." },
    resort: {
      enabled: true,
      name: "Resort testowy",
      description: "Opis lokalnych tras i warunków jazdy.",
      mapUrl: "https://example.test/mapa",
    },
    training: {
      enabled: true,
      description: "Zajęcia na wszystkich poziomach.",
      items: [
        {
          id: termId,
          title: "Szkolenie snowboardowe",
          description: "Technika jazdy w małej grupie.",
          price: emptyPrice(),
          level: "Początkujący",
          scope: "Podstawy skrętu",
        },
      ],
    },
    transport: {
      enabled: true,
      type: "coach" as const,
      description: "Autokar z miejscem na sprzęt.",
      journeys: [
        {
          ...emptyJourney(kind === "day_camp" ? termId : undefined),
          departureDate: "2027-01-01",
          returnDate: "2027-01-07",
          departurePlace: "Warszawa",
          returnPlace: "Warszawa",
        },
      ],
    },
    insurance: {
      enabled: true,
      description: "Przykładowa treść testowa — bez oferty handlowej.",
      provider: "",
      informationUrl: "",
      packages: [
        {
          id: termId,
          title: "Pakiet testowy",
          description: "Opis zakresu ochrony do testów.",
          price,
          risks: [{ id: termId, label: "Koszty leczenia", value: "20 000 EUR" }],
        },
      ],
      extensions: [
        {
          id: termId,
          title: "Rozszerzenie testowe",
          description: "Szczegóły rozszerzenia widoczne bez hover.",
          price,
        },
      ],
    },
  };
  const base = {
    id: termId,
    slug: "qa-sekcje",
    title: "Zimowy wyjazd z ekipą",
    subtitle: "Test sekcji",
    shortDescription: "Lokalna oferta testowa.",
    location: "Góry",
    startDate: "2027-01-01",
    endDate: "2027-01-07",
    durationDays: 7,
    groupSizeMin: 6,
    groupSizeMax: 12,
    priceFrom: 2500,
    currency: "PLN" as const,
    bookingUrl: "https://example.test/tripahead",
    showLastPlacesBadge: false,
    heroImageUrl: null,
    images: [],
    accommodationImages: [],
  };
  return kind === "trip"
    ? {
        ...base,
        offerKind: kind,
        activity: "snow",
        content: { ...content, schedule: [{ day: "Dzień 1", text: "Przyjazd na miejsce." }] },
      }
    : {
        ...base,
        offerKind: kind,
        activity: "snow",
        content: {
          ...content,
          dayProgram: [{ time: "09:00", text: "Zajęcia na stoku." }],
          venueDescription: "Miejsce zajęć testowych.",
          parentInfo: {
            ageRange: "7–14 lat",
            supervision: "Opieka kadry.",
            safety: "Kaski obowiązkowe.",
          },
          terms: [
            {
              id: termId,
              label: "Turnus pierwszy",
              startDate: "2027-01-01",
              endDate: "2027-01-07",
              bookingUrl: base.bookingUrl,
              priceOptions: [{ label: "Pełny turnus", price: 2500 }],
            },
          ],
        },
      };
}
