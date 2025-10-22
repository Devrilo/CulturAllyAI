import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateEventDTO,
  EventResponseDTO,
  UpdateEventDTO,
  GeneratorStatus,
  Feedback,
  ErrorResponseDTO,
} from "../../types";

interface UseGeneratorFlowProps {
  onGenerateSuccess?: (event: EventResponseDTO) => void;
  onSaveSuccess?: (event: EventResponseDTO) => void;
  onRateSuccess?: (event: EventResponseDTO) => void;
}

interface UseGeneratorFlowReturn {
  generate: (data: CreateEventDTO) => void;
  save: (eventId: string) => void;
  rate: (eventId: string, feedback: Feedback) => void;
  copy: (text: string) => Promise<void>;
  status: GeneratorStatus;
}

const TIMEOUT_MS = 10000; // 10 seconds

/**
 * Hook for managing generator flow: mutations, timeout tracking, clipboard operations
 *
 * @param props - Callbacks for success handlers
 * @returns Generator operations and status
 */
export function useGeneratorFlow({
  onGenerateSuccess,
  onSaveSuccess,
  onRateSuccess,
}: UseGeneratorFlowProps = {}): UseGeneratorFlowReturn {
  const [status, setStatus] = useState<GeneratorStatus>({
    isGenerating: false,
    isSaving: false,
    isCopying: false,
    timeoutElapsed: false,
  });

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

  /**
   * Generate event mutation
   */
  const generateMutation = useMutation<EventResponseDTO, Error, CreateEventDTO>({
    mutationFn: async (data: CreateEventDTO) => {
      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController
      abortControllerRef.current = new AbortController();

      // Set timeout for UI notification (10s)
      timeoutTimerRef.current = setTimeout(() => {
        setStatus((prev) => ({ ...prev, timeoutElapsed: true }));
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
      setStatus((prev) => ({
        ...prev,
        isGenerating: true,
        errorCode: undefined,
        timeoutElapsed: false,
      }));
    },
    onSuccess: (data) => {
      setStatus((prev) => ({
        ...prev,
        isGenerating: false,
        lastSuccessAt: Date.now(),
        timeoutElapsed: false,
      }));
      toast.success("Opis został wygenerowany");
      onGenerateSuccess?.(data);
    },
    onError: (error) => {
      setStatus((prev) => ({
        ...prev,
        isGenerating: false,
        errorCode: "GENERATE_ERROR",
        timeoutElapsed: false,
      }));

      if (error.name === "AbortError") {
        return; // Silently ignore aborted requests
      }

      toast.error(error.message || "Wystąpił błąd podczas generowania opisu");
    },
  });

  /**
   * Save event mutation
   */
  const saveMutation = useMutation<EventResponseDTO, Error, string>({
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
    onMutate: () => {
      setStatus((prev) => ({ ...prev, isSaving: true, errorCode: undefined }));
    },
    onSuccess: (data) => {
      setStatus((prev) => ({ ...prev, isSaving: false }));
      toast.success("Wydarzenie zapisane");
      onSaveSuccess?.(data);
    },
    onError: (error) => {
      setStatus((prev) => ({
        ...prev,
        isSaving: false,
        errorCode: "SAVE_ERROR",
      }));
      toast.error(error.message || "Nie udało się zapisać wydarzenia");
    },
  });

  /**
   * Rate event mutation
   */
  const rateMutation = useMutation<EventResponseDTO, Error, { eventId: string; feedback: Feedback }>({
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
      onRateSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || "Nie udało się ocenić wydarzenia");
    },
  });

  /**
   * Copy text to clipboard
   */
  const copy = useCallback(async (text: string): Promise<void> => {
    setStatus((prev) => ({ ...prev, isCopying: true }));

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Skopiowano do schowka");
    } catch {
      toast.error("Nie udało się skopiować. Spróbuj ponownie.");
    } finally {
      setStatus((prev) => ({ ...prev, isCopying: false }));
    }
  }, []);

  return {
    generate: generateMutation.mutate,
    save: saveMutation.mutate,
    rate: (eventId: string, feedback: Feedback) => rateMutation.mutate({ eventId, feedback }),
    copy,
    status,
  };
}
