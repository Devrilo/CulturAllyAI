import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateEventDTO, EventResponseDTO, ErrorResponseDTO } from "../../types";

const TIMEOUT_MS = 10000; // 10 seconds

interface UseEventGenerationReturn {
  generate: (data: CreateEventDTO) => void;
  isGenerating: boolean;
  timeoutElapsed: boolean;
}

/**
 * Hook for generating event descriptions via AI
 * Handles timeout notification and request cancellation
 *
 * @param onSuccess - Callback when generation succeeds
 * @returns Generation function and state
 */
export function useEventGeneration(onSuccess?: (event: EventResponseDTO) => void): UseEventGenerationReturn {
  const [timeoutElapsed, setTimeoutElapsed] = useState(false);

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
      }
    };
  }, []);

  const mutation = useMutation<EventResponseDTO, Error, CreateEventDTO>({
    mutationFn: async (data: CreateEventDTO) => {
      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController
      abortControllerRef.current = new AbortController();

      // Set timeout for UI notification (10s)
      timeoutTimerRef.current = setTimeout(() => {
        setTimeoutElapsed(true);
      }, TIMEOUT_MS);

      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData: ErrorResponseDTO = await response.json();
          throw new Error(errorData.message || "Nie udało się wygenerować opisu");
        }

        const result: EventResponseDTO = await response.json();
        return result;
      } finally {
        // Clear timeout timer
        if (timeoutTimerRef.current) {
          clearTimeout(timeoutTimerRef.current);
          timeoutTimerRef.current = null;
        }
      }
    },
    onMutate: () => {
      setTimeoutElapsed(false);
    },
    onSuccess: (data) => {
      toast.success("Opis został wygenerowany");
      onSuccess?.(data);
    },
    onError: (error) => {
      if (error.name === "AbortError") {
        return; // Silently ignore aborted requests
      }

      toast.error(error.message || "Wystąpił błąd podczas generowania opisu");
    },
  });

  const generate = useCallback(
    (data: CreateEventDTO) => {
      mutation.mutate(data);
    },
    [mutation]
  );

  return {
    generate,
    isGenerating: mutation.isPending,
    timeoutElapsed,
  };
}
