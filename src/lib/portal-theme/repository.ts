import { supabase } from "../supabase";
import { portalThemeRowSchema, portalThemeSchema, type PortalTheme } from "./schema";

async function getPortalTheme(): Promise<PortalTheme> {
  try {
    const { data, error } = await supabase
      .from("portal_settings")
      .select("theme")
      .eq("id", 1)
      .single();
    if (error) throw error;
    return portalThemeRowSchema.parse(data).theme;
  } catch (cause) {
    throw new Error("Nie udało się pobrać wyglądu strony.", { cause });
  }
}

export const getPublicPortalTheme = getPortalTheme;
export const getAdminPortalTheme = getPortalTheme;

export async function savePortalTheme(theme: PortalTheme): Promise<void> {
  try {
    const validatedTheme = portalThemeSchema.parse(theme);
    const { data, error } = await supabase
      .from("portal_settings")
      .update({ theme: validatedTheme })
      .eq("id", 1)
      .select("theme")
      .single();
    if (error) throw error;
    if (portalThemeRowSchema.parse(data).theme !== validatedTheme) {
      throw new Error("Zapis nie potwierdził wybranego motywu.");
    }
  } catch (cause) {
    throw new Error("Nie udało się zapisać wyglądu strony.", { cause });
  }
}
