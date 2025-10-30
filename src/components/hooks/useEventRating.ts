import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EventResponseDTO, UpdateEventDTO, Feedback, ErrorResponseDTO } from "../../types";

interface UseEventRatingReturn {
  rate: (eventId: string, feedback: Feedback) => void;
  isRating: boolean;
}

/**
 * Hook for rating events
 *
 * @param onSuccess - Callback when rating succeeds
 * @returns Rate function and state
 */
export function useEventRating(onSuccess?: (event: EventResponseDTO) => void): UseEventRatingReturn {
  const mutation = useMutation<EventResponseDTO, Error, { eventId: string; feedback: Feedback }>({
    mutationFn: async ({ eventId, feedback }) => {
      const updateData: UpdateEventDTO = { feedback };

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.message || "Nie udało się ocenić wydarzenia");
      }

      const result: EventResponseDTO = await response.json();
      return result;
    },
    onSuccess: (data) => {
      toast.success("Dziękujemy za ocenę");
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || "Nie udało się ocenić wydarzenia");
    },
  });

  return {
    rate: (eventId: string, feedback: Feedback) => mutation.mutate({ eventId, feedback }),
    isRating: mutation.isPending,
  };
}
