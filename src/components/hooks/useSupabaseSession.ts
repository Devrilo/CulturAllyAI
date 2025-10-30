import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "../../db/supabase.client";
import type { AuthState } from "../../types";

/**
 * Hook for managing Supabase session state
 * Monitors auth state changes and provides current authentication status
 *
 * @param supabase - Supabase client instance
 * @returns Current authentication state with session info
 */
export function useSupabaseSession(supabase: SupabaseClient): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
    status: "loading",
  });

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error("Error fetching session:", error);
          setAuthState({
            isAuthenticated: false,
            userId: null,
            status: "error",
          });
          return;
        }

        setAuthState({
          isAuthenticated: !!session,
          userId: session?.user?.id ?? null,
          status: "ready",
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Unexpected error fetching session:", err);
        setAuthState({
          isAuthenticated: false,
          userId: null,
          status: "error",
        });
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setAuthState({
        isAuthenticated: !!session,
        userId: session?.user?.id ?? null,
        status: "ready",
      });
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return authState;
}
