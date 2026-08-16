import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig } from "./env";

const config = getPublicSupabaseConfig();

export const supabase = createClient(config.url, config.anonKey);
