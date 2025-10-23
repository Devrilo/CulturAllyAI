import { useState, useCallback, useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "../ui/sonner";
import { useSupabaseSession } from "../hooks/useSupabaseSession";
import { useEventForm } from "../hooks/useEventForm";
import { useGeneratorFlow } from "../hooks/useGeneratorFlow";
import { supabaseClient } from "../../db/supabase.client";
import { AuthPromptBanner } from "./AuthPromptBanner";
import { TimeoutNotice } from "./TimeoutNotice";
import { EventForm } from "./EventForm";
import { DescriptionPanel } from "./DescriptionPanel";
import type {
  EventCategoriesResponseDTO,
  AgeCategoriesResponseDTO,
  EventResponseDTO,
  GeneratedEventViewModel,
  CategoriesQueryData,
  AgeCategoriesQueryData,
  Feedback,
} from "../../types";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3600000, // 1 hour
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Map EventResponseDTO to GeneratedEventViewModel with UI-friendly labels
 */
function mapEventResponse(
  event: EventResponseDTO,
  categories: CategoriesQueryData,
  ageCategories: AgeCategoriesQueryData
): GeneratedEventViewModel {
  const categoryLabel = categories.find((c) => c.value === event.category)?.label || event.category;
  const ageCategoryLabel = ageCategories.find((c) => c.value === event.age_category)?.label || event.age_category;

  return {
    id: event.id,
    title: event.title,
    city: event.city,
    event_date: event.event_date,
    categoryLabel,
    ageCategoryLabel,
    key_information: event.key_information,
    description: event.edited_description || event.generated_description,
    saved: event.saved,
    feedback: event.feedback,
    createdByAuthenticated: event.created_by_authenticated_user,
    updatedAt: event.updated_at,
  };
}

/**
 * Inner component with React Query context
 */
function GeneratorPageContent() {
  const authState = useSupabaseSession(supabaseClient);
  const { values, errors, updateField, validateAll } = useEventForm();
  const [generatedEvent, setGeneratedEvent] = useState<GeneratedEventViewModel | null>(null);

  // Fetch event categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<EventCategoriesResponseDTO>({
    queryKey: ["categories", "events"],
    queryFn: async () => {
      const response = await fetch("/api/categories/events");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać kategorii wydarzeń");
      }
      return response.json();
    },
  });

  // Fetch age categories
  const {
    data: ageCategoriesData,
    isLoading: ageCategoriesLoading,
    error: ageCategoriesError,
  } = useQuery<AgeCategoriesResponseDTO>({
    queryKey: ["categories", "age"],
    queryFn: async () => {
      const response = await fetch("/api/categories/age");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać kategorii wiekowych");
      }
      return response.json();
    },
  });

  const categories = useMemo(() => categoriesData?.categories || [], [categoriesData]);
  const ageCategories = useMemo(() => ageCategoriesData?.categories || [], [ageCategoriesData]);

  // Generator flow with callbacks
  const { generate, save, rate, copy, status } = useGeneratorFlow({
    onGenerateSuccess: useCallback(
      (event: EventResponseDTO) => {
        setGeneratedEvent(mapEventResponse(event, categories, ageCategories));
      },
      [categories, ageCategories]
    ),
    onSaveSuccess: useCallback(
      (event: EventResponseDTO) => {
        setGeneratedEvent(mapEventResponse(event, categories, ageCategories));
      },
      [categories, ageCategories]
    ),
    onRateSuccess: useCallback(
      (event: EventResponseDTO) => {
        setGeneratedEvent(mapEventResponse(event, categories, ageCategories));
      },
      [categories, ageCategories]
    ),
  });

  // Handlers
  const handleGenerate = useCallback(() => {
    if (!validateAll()) {
      return;
    }
    generate({
      title: values.title,
      city: values.city,
      event_date: values.event_date,
      category: values.category,
      age_category: values.age_category,
      key_information: values.key_information,
    });
  }, [validateAll, generate, values]);

  const handleSave = useCallback(() => {
    if (!generatedEvent) return;
    save(generatedEvent.id);
  }, [generatedEvent, save]);

  const handleRate = useCallback(
    (feedback: Feedback) => {
      if (!generatedEvent) return;
      rate(generatedEvent.id, feedback);
    },
    [generatedEvent, rate]
  );

  const handleCopy = useCallback(() => {
    if (!generatedEvent) return;
    copy(generatedEvent.description);
  }, [generatedEvent, copy]);

  // Loading state
  if (authState.status === "loading" || categoriesLoading || ageCategoriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (categoriesError || ageCategoriesError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Wystąpił błąd podczas ładowania danych.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Odśwież stronę
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <AuthPromptBanner visible={!authState.isAuthenticated && !!generatedEvent} />
        <TimeoutNotice visible={status.timeoutElapsed} onRetry={handleGenerate} />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Form */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Dane wydarzenia</h2>
            <EventForm
              values={values}
              errors={errors}
              onChange={updateField}
              onSubmit={handleGenerate}
              disabled={status.isGenerating}
              categories={categories}
              ageCategories={ageCategories}
            />
          </div>

          {/* Right Column: Preview */}
          <div>
            <DescriptionPanel
              generated={generatedEvent}
              isGenerating={status.isGenerating}
              isSaving={status.isSaving}
              isCopying={status.isCopying}
              isAuthenticated={authState.isAuthenticated}
              onGenerate={handleGenerate}
              onSave={handleSave}
              onCopy={handleCopy}
              onRate={handleRate}
            />
          </div>
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
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
