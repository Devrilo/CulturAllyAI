import { useState, useEffect, useCallback, useMemo } from "react";
import type { EventsFiltersState, EventCategory, AgeCategory } from "@/types";

interface UseEventsFiltersReturn {
  filters: EventsFiltersState;
  updateFilters: (updates: Partial<Omit<EventsFiltersState, "saved">>) => void;
  resetFilters: () => void;
  isReady: boolean;
}

const DEFAULT_FILTERS: EventsFiltersState = {
  saved: true,
  sort: "created_at",
  order: "desc",
  page: 1,
};

/**
 * Hook for managing events filters with URL synchronization and debouncing
 * Filters are synced with URLSearchParams with 300ms debounce
 */
export function useEventsFilters(): UseEventsFiltersReturn {
  const [filters, setFilters] = useState<EventsFiltersState>(DEFAULT_FILTERS);
  const [isReady, setIsReady] = useState(false);

  // Initialize filters from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const urlFilters: EventsFiltersState = {
      ...DEFAULT_FILTERS,
      category: (params.get("category") as EventCategory) || undefined,
      age_category: (params.get("age_category") as AgeCategory) || undefined,
      sort: (params.get("sort") as EventsFiltersState["sort"]) || DEFAULT_FILTERS.sort,
      order: (params.get("order") as EventsFiltersState["order"]) || DEFAULT_FILTERS.order,
      page: parseInt(params.get("page") || "1", 10),
    };

    setFilters(urlFilters);
    setIsReady(true);
  }, []);

  // Sync filters to URL with debounce
  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;

    // Debounced URL update
    const timer = setTimeout(() => {
      const params = new URLSearchParams();

      // Add defined filters to URL
      if (filters.category) params.set("category", filters.category);
      if (filters.age_category) params.set("age_category", filters.age_category);
      params.set("sort", filters.sort);
      params.set("order", filters.order);
      if (filters.page > 1) params.set("page", filters.page.toString());

      // Update URL without reload
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timer);
    };
  }, [filters, isReady]);

  // Update filters handler
  const updateFilters = useCallback((updates: Partial<Omit<EventsFiltersState, "saved">>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
      // Reset to page 1 when filters change (except when explicitly setting page)
      page: updates.page !== undefined ? updates.page : 1,
    }));
  }, []);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return useMemo(
    () => ({
      filters,
      updateFilters,
      resetFilters,
      isReady,
    }),
    [filters, updateFilters, resetFilters, isReady]
  );
}
