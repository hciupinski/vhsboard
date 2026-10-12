export type SocialImage = { path: string; alt: string; width: 1200; height: 630 };
const image = (key: string, alt: string): SocialImage => ({
  path: `/og/${key}.jpg`,
  alt,
  width: 1200,
  height: 630,
});
export const SOCIAL_IMAGES = {
  home: image("home", "VHSBOARD — dobre rzeczy poza codziennym planem"),
  about: image("about", "Poznaj ekipę VHSBOARD"),
  trips: image("trips", "Wyjazdy surfingowe i snowboardowe VHSBOARD"),
  events: image("events", "Eventy z torem skimboardowym VHSBOARD"),
  camps: image("camps", "Aktywne obozy VHSBOARD"),
  contact: image("contact", "Porozmawiaj z ekipą VHSBOARD"),
  offers: image("offers", "Oferty wyjazdów i obozów VHSBOARD"),
} as const;
