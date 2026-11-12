export const documentCategories = {
  trips: "Wyjazdy",
  camps: "Obozy i półkolonie",
  organizer: "Organizator i strona",
} as const;

export type DocumentCategory = keyof typeof documentCategories;
