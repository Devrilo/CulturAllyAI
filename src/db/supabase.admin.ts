import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Admin client for server-side operations requiring elevated permissions
// Uses SERVICE_ROLE_KEY which bypasses RLS policies
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase admin environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
}

/**
 * Supabase admin client with service role key
 *
 * WARNING: This client bypasses Row Level Security (RLS) policies
 * Only use in secure server-side contexts (API routes, middleware)
 * Never expose service role key or admin client to the client-side
 *
 * Use cases:
 * - User management (create, delete, update users)
 * - Admin operations requiring elevated permissions
 * - Bypassing RLS for specific operations
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
