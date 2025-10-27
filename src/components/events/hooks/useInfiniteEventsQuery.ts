import { useInfiniteQuery } from "@tanstack/react-query";
import type {
  EventsFiltersState,
  SavedEventViewModel,
  EventCategoryDTO,
  AgeCategoryDTO,
  EventsListStatus,
} from "@/types";
import { fetchEvents } from "@/lib/api/events";
import { mapEventToViewModel } from "../utils";

interface UseInfiniteEventsQueryOptions {
  filters: EventsFiltersState;
  categories: EventCategoryDTO[];
  ageCategories: AgeCategoryDTO[];
  enabled?: boolean;
}

interface UseInfiniteEventsQueryReturn {
  events: SavedEventViewModel[];
  status: EventsListStatus;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  total: number;
}

/**
 * Hook for fetching events with infinite scroll
 * Automatically maps EventListItemDTO to SavedEventViewModel
 */
export function useInfiniteEventsQuery({
  filters,
  categories,
  ageCategories,
  enabled = true,
}: UseInfiniteEventsQueryOptions): UseInfiniteEventsQueryReturn {
  const query = useInfiniteQuery({
    queryKey: ["events", filters],
    queryFn: async ({ pageParam = 1 }) => {
      return fetchEvents({
        ...filters,
        page: pageParam,
        limit: 20,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 300000, // 5 minutes
    enabled,
  });

  // Flatten pages and map to view models
  const events: SavedEventViewModel[] =
    query.data?.pages.flatMap((page) =>
      page.data.map((event) => mapEventToViewModel(event, categories, ageCategories))
    ) ?? [];

  // Get total from first page
  const total = query.data?.pages[0]?.pagination.total ?? 0;

  const status: EventsListStatus = {
    isLoading: query.isLoading,
    isFetchingNext: query.isFetchingNextPage,
    isError: query.isError,
    errorCode: query.error ? String(query.error) : undefined,
  };

  return {
    events,
    status,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    total,
  };
}
