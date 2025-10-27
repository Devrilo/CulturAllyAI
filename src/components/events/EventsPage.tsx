import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useSupabaseSession } from "@/components/hooks/useSupabaseSession";
import { supabaseClient } from "@/db/supabase.client";
import type { EventCategoryDTO, AgeCategoryDTO } from "@/types";
import { EventsLayout } from "./EventsLayout";
import { FiltersBar } from "./FiltersBar";
import { EventsSummary } from "./EventsSummary";
import { EventList } from "./EventList";
import { EmptyState } from "./EmptyState";
import { ErrorBoundary } from "./ErrorBoundary";
import { useEventsFilters } from "./hooks/useEventsFilters";
import { useEventCategoriesQuery, useAgeCategoriesQuery } from "./hooks/useCategoriesQuery";
import { useInfiniteEventsQuery } from "./hooks/useInfiniteEventsQuery";
import { useDeleteEventMutation, useEditEventMutation } from "./hooks/useEventMutations";

interface EventsPageProps {
  initialCategories?: EventCategoryDTO[];
  initialAgeCategories?: AgeCategoryDTO[];
}

/**
 * Inner component that uses React Query hooks
 * Must be inside QueryClientProvider
 */
function EventsPageContent({
  initialCategories,
  initialAgeCategories,
}: {
  initialCategories: EventCategoryDTO[];
  initialAgeCategories: AgeCategoryDTO[];
}) {
  const auth = useSupabaseSession(supabaseClient);

  // Fetch categories with 1h cache
  const { data: categories = [], isError: categoriesError } = useEventCategoriesQuery(initialCategories);
  const { data: ageCategories = [], isError: ageCategoriesError } = useAgeCategoriesQuery(initialAgeCategories);

  // Initialize filters
  const { filters, updateFilters, resetFilters, isReady } = useEventsFilters();

  // Fetch events with infinite scroll
  const { events, status, hasNextPage, fetchNextPage, total } = useInfiniteEventsQuery({
    filters,
    categories,
    ageCategories,
    enabled: isReady && auth.status === "ready" && auth.isAuthenticated,
  });

  // Delete mutation
  const deleteEventMutation = useDeleteEventMutation();

  // Edit mutation
  const editEventMutation = useEditEventMutation();

  // Show toast if categories fail to load
  useEffect(() => {
    if (categoriesError) {
      toast.error("Nie udało się pobrać kategorii wydarzeń");
    }
    if (ageCategoriesError) {
      toast.error("Nie udało się pobrać kategorii wiekowych");
    }
  }, [categoriesError, ageCategoriesError]);

  // Copy handler
  const handleCopy = useCallback(async (description: string) => {
    try {
      await navigator.clipboard.writeText(description);
      toast.success("Skopiowano opis do schowka");
    } catch {
      toast.error("Nie udało się skopiować opisu");
    }
  }, []);

  // Delete handler with mutation
  const handleDelete = useCallback(
    (id: string) => {
      deleteEventMutation.mutate(id);
    },
    [deleteEventMutation]
  );

  // Edit handler with mutation
  const handleEdit = useCallback(
    (id: string, newDescription: string) => {
      editEventMutation.mutate({ id, edited_description: newDescription });
    },
    [editEventMutation]
  );

  // Redirect if not authenticated using useEffect
  useEffect(() => {
    if (auth.status === "ready" && !auth.isAuthenticated) {
      toast.info("Musisz być zalogowany, aby zobaczyć swoje wydarzenia");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
  }, [auth.status, auth.isAuthenticated]);

  // Show loading state while checking auth
  if (auth.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <EventsLayout>
          {/* Sidebar with filters */}
          <aside className="w-full lg:w-80 lg:sticky lg:top-4 lg:h-fit">
            <FiltersBar
              filters={filters}
              categories={categories}
              ageCategories={ageCategories}
              onChange={updateFilters}
              disabled={!isReady}
            />
          </aside>

          {/* Main content area */}
          <main className="flex-1">
            <EventsSummary
              total={total}
              activeFilters={[filters.category, filters.age_category].filter(Boolean).length}
              onClearFilters={resetFilters}
            />

            {/* Show empty state when no events */}
            {events.length === 0 && !status.isLoading && (
              <EmptyState
                visible={true}
                filtered={!!(filters.category || filters.age_category)}
                onReset={resetFilters}
              />
            )}

            {/* Show event list */}
            {events.length > 0 && (
              <EventList
                events={events}
                status={status}
                onLoadMore={fetchNextPage}
                hasNextPage={hasNextPage}
                onCopy={handleCopy}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            )}
          </main>
        </EventsLayout>
      </div>
    </ErrorBoundary>
  );
}

export default function EventsPage({ initialCategories = [], initialAgeCategories = [] }: EventsPageProps) {
  // Create QueryClient with optimized defaults
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 300000, // 5 minutes
            refetchOnWindowFocus: true,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <EventsPageContent initialCategories={initialCategories} initialAgeCategories={initialAgeCategories} />
      <Toaster />
    </QueryClientProvider>
  );
}
