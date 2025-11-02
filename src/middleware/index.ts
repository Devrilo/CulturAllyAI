import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Get environment variables with proper fallback chain:
  // 1. Cloudflare Pages runtime (production)
  // 2. import.meta.env (Vite/Astro - works in dev & test with dotenv)
  // @ts-expect-error - runtime.env is available in Cloudflare Pages adapter
  const runtime = context.locals.runtime;
  
  // Use import.meta.env as primary source (works everywhere)
  // Only fall back to runtime in actual Cloudflare environment
  const supabaseUrl = import.meta.env.SUPABASE_URL || runtime?.env?.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY || runtime?.env?.SUPABASE_KEY;
  const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY || runtime?.env?.OPENROUTER_API_KEY;

  // Create Supabase server client with cookie handling
  // This automatically reads tokens from Supabase cookies (sb-access-token, sb-refresh-token)
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Parse cookies from request headers
        const cookieHeader = context.request.headers.get("cookie");
        if (!cookieHeader) return [];

        // Parse cookie string into array of {name, value} objects
        return cookieHeader.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll(cookiesToSet) {
        // Set cookies in response headers
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });

  context.locals.supabase = supabase;
  context.locals.openRouterApiKey = openRouterApiKey;
  return next();
});
