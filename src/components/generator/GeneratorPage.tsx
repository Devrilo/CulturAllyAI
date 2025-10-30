import { QueryClientProvider } from "@tanstack/react-query";
import { useSupabaseSession } from "../hooks/useSupabaseSession";
import { useGenerator } from "../hooks/useGenerator";
import { supabaseClient } from "../../db/supabase.client";
import { createQueryClient } from "../../lib/query-client";
import { GeneratorPageView } from "./GeneratorPageView";

// Create QueryClient instance
const queryClient = createQueryClient();

/**
 * Container component with business logic
 */
function GeneratorPageContent() {
  const authState = useSupabaseSession(supabaseClient);
  const generator = useGenerator();

  return (
    <GeneratorPageView
      generator={generator}
      isAuthenticated={authState.isAuthenticated}
      isLoadingAuth={authState.status === "loading"}
    />
  );
}

/**
 * Main Generator Page component with React Query provider
 */
export default function GeneratorPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <GeneratorPageContent />
    </QueryClientProvider>
  );
}
