const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const documentPathPattern = new RegExp(`^documents/${uuidPattern.source.slice(1, -1)}\\.pdf$`, "i");

export const createDocumentPath = (id: string): string => {
  if (!uuidPattern.test(id)) {
    throw new Error("Nieprawidłowy identyfikator dokumentu.");
  }

  return `documents/${id}.pdf`;
};

export const isDocumentPath = (path: string): boolean => documentPathPattern.test(path);
