import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EventResponseDTO, UpdateEventDTO, ErrorResponseDTO } from "../../types";

interface UseEventSaveReturn {
  save: (eventId: string) => void;
  isSaving: boolean;
}

/**
 * Hook for saving events
 *
 * @param onSuccess - Callback when save succeeds
 * @returns Save function and state
 */
export function useEventSave(onSuccess?: (event: EventResponseDTO) => void): UseEventSaveReturn {
  const mutation = useMutation<EventResponseDTO, Error, string>({
    mutationFn: async (eventId: string) => {
      const updateData: UpdateEventDTO = { saved: true };

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.message || "Nie udało się zapisać wydarzenia");
      }

      const result: EventResponseDTO = await response.json();
      return result;
    },
    onSuccess: (data) => {
      toast.success("Wydarzenie zapisane");
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || "Nie udało się zapisać wydarzenia");
    },
  });

  return {
    save: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
