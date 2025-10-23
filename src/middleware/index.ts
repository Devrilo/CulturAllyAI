import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;

export const onRequest = defineMiddleware((context, next) => {
  // Pobierz token z headera Authorization
  const authHeader = context.request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  // Utwórz klienta Supabase z tokenem użytkownika (jeśli istnieje)
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });

  context.locals.supabase = supabase;
  context.locals.openRouterApiKey = openRouterApiKey;
  return next();
});
