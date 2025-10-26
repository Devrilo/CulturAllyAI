import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

// For client-side usage, Astro requires PUBLIC_ prefix
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY are required");
}

// Create Supabase browser client with SSR cookie support
// This automatically manages cookies for seamless SSR/client-side auth
export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "32373b34-4b94-4cbc-973b-949c6659cbee";
