import { supabase } from "../supabase";

const baseColumns = "id,offer_id,storage_path,alt_text,category,position";

export function isMissingStoryImageColumn(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return (
    "code" in error &&
    error.code === "42703" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("show_in_story")
  );
}

export async function readOfferImageRows(offerId: string) {
  const fetch = (columns: string) =>
    supabase
      .from("offer_images")
      .select(columns)
      .eq("offer_id", offerId)
      .order("position", { ascending: true });
  const result = await fetch(`${baseColumns},show_in_story`);
  return isMissingStoryImageColumn(result.error) ? await fetch(baseColumns) : result;
}
