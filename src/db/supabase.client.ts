import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// For client-side usage, Astro requires PUBLIC_ prefix
// For server-side (middleware, API routes), use without prefix
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. For client-side usage, set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY"
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "32373b34-4b94-4cbc-973b-949c6659cbee";
