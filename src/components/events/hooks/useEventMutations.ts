import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateEvent, deleteEvent } from "@/lib/api/events";
import type { UpdateEventDTO } from "@/types";

/**
 * Hook for delete event mutation with optimistic updates
 */
export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteEvent(id);
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["events"] });

      // Snapshot previous value
      const previousEvents = queryClient.getQueryData(["events"]);

      // Optimistically remove from cache
      queryClient.setQueriesData({ queryKey: ["events"] }, (old: unknown): unknown => {
        if (!old || typeof old !== "object" || !("pages" in old)) return old;
        const oldData = old as { pages: { data: { id: string }[]; pagination: { total: number } }[] };
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.filter((event) => event.id !== id),
            pagination: {
              ...page.pagination,
              total: page.pagination.total - 1,
            },
          })),
        };
      });

      return { previousEvents };
    },
    onError: (err, _id, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(["events"], context.previousEvents);
      }
      const errorMessage = String(err);
      if (errorMessage.includes("404") || errorMessage.includes("403")) {
        toast.error("Nie znaleziono wydarzenia lub brak uprawnień");
      } else {
        toast.error("Nie udało się usunąć wydarzenia");
      }
    },
    onSuccess: () => {
      toast.success("Wydarzenie usunięte");
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/**
 * Hook for edit event description mutation
 */
export function useEditEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, edited_description }: { id: string; edited_description: string }) => {
      const payload: UpdateEventDTO = { edited_description };
      return updateEvent(id, payload);
    },
    onMutate: async ({ id, edited_description }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["events"] });

      // Snapshot previous value
      const previousEvents = queryClient.getQueryData(["events"]);

      // Optimistically update cache
      queryClient.setQueriesData({ queryKey: ["events"] }, (old: unknown): unknown => {
        if (!old || typeof old !== "object" || !("pages" in old)) return old;
        const oldData = old as {
          pages: {
            data: { id: string; edited_description: string; updated_at: string }[];
            pagination: { total: number };
          }[];
        };
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((event) =>
              event.id === id
                ? {
                    ...event,
                    edited_description,
                    updated_at: new Date().toISOString(),
                  }
                : event
            ),
          })),
        };
      });

      return { previousEvents };
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(["events"], context.previousEvents);
      }
      const errorMessage = String(err);
      if (errorMessage.includes("400")) {
        toast.error("Nieprawidłowe dane. Sprawdź długość opisu (max 500 znaków)");
      } else if (errorMessage.includes("404") || errorMessage.includes("403")) {
        toast.error("Nie znaleziono wydarzenia lub brak uprawnień");
      } else {
        toast.error("Nie udało się zapisać zmian");
      }
    },
    onSuccess: () => {
      toast.success("Zapisano zmiany");
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
