import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseClipboardReturn {
  copy: (text: string) => Promise<void>;
  isCopying: boolean;
}

/**
 * Reusable hook for clipboard operations
 * Handles copying text with visual feedback via toast
 *
 * @returns Object with copy function and copying state
 *
 * @example
 * ```tsx
 * const { copy, isCopying } = useClipboard();
 * await copy("Hello World");
 * ```
 */
export function useClipboard(): UseClipboardReturn {
  const [isCopying, setIsCopying] = useState(false);

  const copy = useCallback(async (text: string): Promise<void> => {
    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Skopiowano do schowka");
    } catch {
      toast.error("Nie udało się skopiować. Spróbuj ponownie.");
    } finally {
      setIsCopying(false);
    }
  }, []);

  return {
    copy,
    isCopying,
  };
}
