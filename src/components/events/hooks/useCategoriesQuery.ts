import { useQuery } from "@tanstack/react-query";
import type { EventCategoryDTO, AgeCategoryDTO } from "@/types";
import { fetchEventCategories, fetchAgeCategories } from "@/lib/api/events";

/**
 * Hook for fetching event categories with 1h cache
 */
export function useEventCategoriesQuery(initialData?: EventCategoryDTO[]) {
  return useQuery({
    queryKey: ["categories", "events"],
    queryFn: async () => {
      const response = await fetchEventCategories();
      return response.categories;
    },
    staleTime: 3600000, // 1 hour
    retry: 2,
    initialData,
  });
}

/**
 * Hook for fetching age categories with 1h cache
 */
export function useAgeCategoriesQuery(initialData?: AgeCategoryDTO[]) {
  return useQuery({
    queryKey: ["categories", "age"],
    queryFn: async () => {
      const response = await fetchAgeCategories();
      return response.categories;
    },
    staleTime: 3600000, // 1 hour
    retry: 2,
    initialData,
  });
}
