import { QueryClient } from "@tanstack/react-query";

/**
 * Create a new QueryClient instance with default configuration
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
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
}
