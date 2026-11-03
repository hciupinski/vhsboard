import type { ChangeEvent } from "react";
import type { OfferContent } from "@/lib/offers/types";
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

export const fieldState = (
  errors: Record<string, string>,
  path: string,
  id = path.replaceAll(".", "-"),
) => {
  const error = errorFor(errors, path);
  return {
    "aria-describedby": error ? `${id}-error` : undefined,
    "aria-invalid": error ? true : undefined,
  };
};

export type EditorErrors = Record<string, string>;
export type ContentEditorProps<T extends OfferContent> = {
  content: T;
  errors: EditorErrors;
  disabled: boolean;
  onChange: (content: T) => void;
};
