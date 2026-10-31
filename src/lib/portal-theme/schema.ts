import { z } from "zod";

export const portalThemeSchema = z.enum(["original", "winter"]);
export const portalThemeRowSchema = z.object({ theme: portalThemeSchema });
export type PortalTheme = z.infer<typeof portalThemeSchema>;
