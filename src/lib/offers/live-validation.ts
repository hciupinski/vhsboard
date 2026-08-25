import {
  editorOfferInputSchema,
  getEditorFieldErrors,
  type EditableOfferInput,
} from "./editor-schema";

const changedPaths = (previous: unknown, next: unknown, prefix = ""): string[] => {
  if (Object.is(previous, next)) return [];

  if (
    typeof previous !== "object" ||
    previous === null ||
    typeof next !== "object" ||
    next === null
  ) {
    return [prefix];
  }

  const previousRecord = previous as Record<string, unknown>;
  const nextRecord = next as Record<string, unknown>;
  return [...new Set([...Object.keys(previousRecord), ...Object.keys(nextRecord)])].flatMap((key) =>
    changedPaths(previousRecord[key], nextRecord[key], prefix ? `${prefix}.${key}` : key),
  );
};

const pathsAreRelated = (first: string, second: string) => {
  if (first === second || first.startsWith(`${second}.`) || second.startsWith(`${first}.`)) {
    return true;
  }

  const firstParts = first.split(".");
  const secondParts = second.split(".");
  return (
    firstParts.length >= 3 &&
    secondParts.length >= 3 &&
    firstParts.slice(0, 3).join(".") === secondParts.slice(0, 3).join(".")
  );
};

export const getLiveFieldErrors = (
  previous: EditableOfferInput,
  next: EditableOfferInput,
  currentErrors: Record<string, string>,
): Record<string, string> => {
  const changed = changedPaths(previous, next);
  if (changed.includes("offerKind")) return {};

  const validation = editorOfferInputSchema.safeParse(next);
  const validationErrors = validation.success ? {} : getEditorFieldErrors(validation.error);
  const nextErrors = { ...currentErrors };

  for (const path of Object.keys(nextErrors)) {
    if (changed.some((changedPath) => pathsAreRelated(path, changedPath))) {
      delete nextErrors[path];
    }
  }

  for (const [path, message] of Object.entries(validationErrors)) {
    if (changed.some((changedPath) => pathsAreRelated(path, changedPath))) {
      nextErrors[path] = message;
    }
  }

  return nextErrors;
};
