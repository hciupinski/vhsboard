import type { DocumentCategory } from "./categories";

export type ContactDocument = {
  id: string;
  title: string;
  path: string;
  position: number;
  category?: DocumentCategory | null;
  signedUrl: string | null;
};
