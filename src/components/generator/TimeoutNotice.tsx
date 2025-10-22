import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Timer } from "lucide-react";

interface TimeoutNoticeProps {
  visible: boolean;
  onRetry: () => void;
}

/**
 * Alert shown when generation takes longer than expected (>10s)
 */
export function TimeoutNotice({ visible, onRetry }: TimeoutNoticeProps) {
  if (!visible) return null;

  return (
    <Alert variant="default" className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <Timer className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-orange-900 dark:text-orange-100">
          Generowanie trwa dłużej niż zwykle. Możesz poczekać lub spróbować ponownie.
        </span>
        <Button onClick={onRetry} variant="outline" size="sm" className="ml-4">
          Spróbuj ponownie
        </Button>
      </AlertDescription>
    </Alert>
  );
}
