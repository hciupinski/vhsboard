import type { ChangeEvent } from "react";
import { shouldCommitDateValue } from "@/lib/offers/date-input";

export const errorFor = (errors: Record<string, string>, path: string) =>
  errors[path] ?? Object.entries(errors).find(([key]) => key.startsWith(`${path}.`))?.[1];
export const nullableNumber = (value: string) => (value === "" ? null : Number(value));

export const toOfferSlug = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("pl-PL")
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const shouldUpdateDate = (event: ChangeEvent<HTMLInputElement>) =>
  shouldCommitDateValue(event.currentTarget.value, event.currentTarget.validity.badInput);
