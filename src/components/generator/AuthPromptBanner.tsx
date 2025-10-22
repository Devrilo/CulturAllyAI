import { Alert, AlertDescription } from "../ui/alert";
import { Info } from "lucide-react";

interface AuthPromptBannerProps {
  visible: boolean;
}

/**
 * Banner prompting guests to log in for additional features
 */
export function AuthPromptBanner({ visible }: AuthPromptBannerProps) {
  if (!visible) return null;

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
        <a href="/login" className="font-medium underline hover:no-underline">
          Zaloguj się
        </a>{" "}
        aby zapisywać i oceniać wydarzenia
      </AlertDescription>
    </Alert>
  );
}
