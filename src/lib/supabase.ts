import { createClient } from "@supabase/supabase-js";

import { installPasswordRecoveryHandler } from "./auth/recovery-bootstrap";
import { getPublicSupabaseConfig } from "./env";

const config = getPublicSupabaseConfig();

export const supabase = createClient(config.url, config.anonKey);

installPasswordRecoveryHandler(supabase);
