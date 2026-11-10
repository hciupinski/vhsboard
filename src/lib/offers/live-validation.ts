import type { EditableOfferInput } from "./editor-schema";

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

const relatedFields: Record<string, string> = {
  startDate: "endDate",
  endDate: "startDate",
  groupSizeMin: "groupSizeMax",
  groupSizeMax: "groupSizeMin",
  "content.terms": "content.transport",
};

export function recordEditedFields(
  previous: EditableOfferInput,
  next: EditableOfferInput,
  edited: ReadonlySet<string>,
): ReadonlySet<string> {
  if ((previous.offerKind ?? "trip") !== (next.offerKind ?? "trip")) return new Set();

  const scopes = new Set(edited);
  for (const path of changedPaths(previous, next)) {
    const scope = path.startsWith("content.") ? path.split(".").slice(0, 2).join(".") : path;
    scopes.add(scope);
    const related = relatedFields[scope];
    if (related) scopes.add(related);
  }
  return scopes;
}

export function visibleOfferErrors(
  errors: Record<string, string>,
  edited: ReadonlySet<string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).filter(([path]) => {
      const [root, section] = path.split(".");
      return edited.has(path) || (root === "content" && edited.has(`content.${section}`));
    }),
  );
}
