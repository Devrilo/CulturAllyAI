import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEventForm } from "./useEventForm";
import { useGeneratorFlow } from "./useGeneratorFlow";
import { mapEventResponse } from "../../lib/mappers/event-mappers";
import type {
  EventCategoriesResponseDTO,
  AgeCategoriesResponseDTO,
  EventResponseDTO,
  GeneratedEventViewModel,
  Feedback,
} from "../../types";

export interface UseGeneratorReturn {
  // Form state
  values: ReturnType<typeof useEventForm>["values"];
  errors: ReturnType<typeof useEventForm>["errors"];
  updateField: ReturnType<typeof useEventForm>["updateField"];

  // Generated event
  generatedEvent: GeneratedEventViewModel | null;

  // Categories
  categories: EventCategoriesResponseDTO["categories"];
  ageCategories: AgeCategoriesResponseDTO["categories"];

  // Loading states
  isLoadingData: boolean;
  hasDataError: boolean;

  // Generator status
  status: ReturnType<typeof useGeneratorFlow>["status"];

  // Actions
  handleGenerate: () => void;
  handleSave: () => void;
  handleRate: (feedback: Feedback) => void;
  handleCopy: () => void;
  reloadData: () => void;
}

/**
 * Composite hook that manages all generator-related logic
 */
export function useGenerator(): UseGeneratorReturn {
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

  const reloadData = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    values,
    errors,
    updateField,
    generatedEvent,
    categories,
    ageCategories,
    isLoadingData: categoriesLoading || ageCategoriesLoading,
    hasDataError: !!(categoriesError || ageCategoriesError),
    status,
    handleGenerate,
    handleSave,
    handleRate,
    handleCopy,
    reloadData,
  };
}
