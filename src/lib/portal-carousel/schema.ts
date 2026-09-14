import { z } from "zod";

export const portalCarouselRowSchema = z.object({
  id: z.string().uuid(),
  image_path: z.string().min(1),
  position: z.number().int().nonnegative(),
});

export type PortalCarouselRow = z.infer<typeof portalCarouselRowSchema>;
