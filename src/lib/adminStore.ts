import { trips as defaultTrips, type Trip } from "@/lib/trips";

const KEY = "saltline.offers.v1";

export type OfferDraft = Trip & { status: "draft" | "published"; updatedAt: string };

const toDraft = (t: Trip): OfferDraft => ({
  ...t,
  status: "published",
  updatedAt: "2026-08-01",
});

export function loadOffers(): OfferDraft[] {
  if (typeof window === "undefined") return defaultTrips.map(toDraft);
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultTrips.map(toDraft);
    const parsed = JSON.parse(raw) as OfferDraft[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultTrips.map(toDraft);
    return parsed;
  } catch {
    return defaultTrips.map(toDraft);
  }
}

export function saveOffers(offers: OfferDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(offers));
}

export function upsertOffer(offer: OfferDraft) {
  const offers = loadOffers();
  const i = offers.findIndex((o) => o.slug === offer.slug);
  const next = { ...offer, updatedAt: new Date().toISOString().slice(0, 10) };
  if (i >= 0) offers[i] = next;
  else offers.unshift(next);
  saveOffers(offers);
  return next;
}

export function deleteOffer(slug: string) {
  saveOffers(loadOffers().filter((o) => o.slug !== slug));
}

export function emptyOffer(): OfferDraft {
  return {
    slug: "",
    tag: "Surf",
    title: "",
    place: "",
    days: "",
    price: "",
    text: "",
    image: "",
    intro: "",
    description: [""],
    highlights: [""],
    included: [""],
    notIncluded: [""],
    schedule: [{ day: "Day 1", text: "" }],
    gallery: [],
    status: "draft",
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
