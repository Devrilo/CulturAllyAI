import { useMemo } from "react";
import type { CreateEventDTO, GeneratorStatus, Feedback, EventResponseDTO } from "../../types";
import { useEventGeneration } from "./useEventGeneration";
import { useEventSave } from "./useEventSave";
import { useEventRating } from "./useEventRating";
import { useClipboard } from "./useClipboard";

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

/**
 * Facade hook that combines all generator operations
 * Uses composition of smaller, specialized hooks
 *
 * @param props - Callbacks for success handlers
 * @returns Generator operations and combined status
 */
export function useGeneratorFlow({
  onGenerateSuccess,
  onSaveSuccess,
  onRateSuccess,
}: UseGeneratorFlowProps = {}): UseGeneratorFlowReturn {
  // Compose specialized hooks
  const generation = useEventGeneration(onGenerateSuccess);
  const saving = useEventSave(onSaveSuccess);
  const rating = useEventRating(onRateSuccess);
  const clipboard = useClipboard();

  // Combine status from all hooks
  const status = useMemo<GeneratorStatus>(
    () => ({
      isGenerating: generation.isGenerating,
      isSaving: saving.isSaving,
      isCopying: clipboard.isCopying,
      timeoutElapsed: generation.timeoutElapsed,
    }),
    [generation.isGenerating, generation.timeoutElapsed, saving.isSaving, clipboard.isCopying]
  );

  return {
    generate: generation.generate,
    save: saving.save,
    rate: rating.rate,
    copy: clipboard.copy,
    status,
  };
}
