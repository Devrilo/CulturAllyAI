import { useCallback, useEffect, useState } from "react";
import { Header } from "./Header";
import { supabaseClient } from "../../db/supabase.client";
import type { Session } from "@supabase/supabase-js";

/**
 * App-wide header component that manages authentication state
 * and can be used in the global layout
 */
export function AppHeader() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "/login";
  }, []);

  // Don't render anything while loading to avoid flash of wrong content
  if (loading) {
    return (
      <header className="border-b bg-background">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">CulturAllyAI</h1>
        </nav>
      </header>
    );
  }

  return <Header isAuthenticated={!!session} onSignOut={handleSignOut} />;
}
