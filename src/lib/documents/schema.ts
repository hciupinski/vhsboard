import { z } from "zod";

import { isDocumentPath } from "./path";

export const contactDocumentRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  storage_path: z.string().trim().refine(isDocumentPath, "Nieprawidłowa ścieżka dokumentu."),
  position: z.number().int().nonnegative(),
});

export type ContactDocumentRow = z.infer<typeof contactDocumentRowSchema>;
