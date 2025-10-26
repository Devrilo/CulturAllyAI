import { Alert } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";

interface AuthErrorAlertProps {
  error: AuthError | Error | null;
  className?: string;
}

/**
 * Maps Supabase Auth error codes to user-friendly Polish messages
 */
function mapAuthErrorToMessage(error: AuthError | Error): string {
  if ("status" in error && error.status) {
    // Supabase AuthError with status code
    const authError = error as AuthError;

    switch (authError.message) {
      case "Invalid login credentials":
        return "Nieprawidłowy email lub hasło";
      case "Email not confirmed":
        return "Email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.";
      case "User already registered":
        return "Użytkownik z tym adresem email już istnieje";
      case "Password should be at least 8 characters":
        return "Hasło musi mieć minimum 8 znaków";
      case "Signup requires a valid password":
        return "Podaj prawidłowe hasło";
      case "Invalid email":
        return "Nieprawidłowy format adresu email";
      case "Email rate limit exceeded":
        return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
      case "User not found":
        return "Użytkownik nie został znaleziony";
      default:
        // Check for specific status codes
        if (authError.status === 429) {
          return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
        }
        if (authError.status && authError.status >= 500) {
          return "Problem z serwerem. Spróbuj ponownie później.";
        }
    }
  }

  // Generic error message
  return error.message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
}

/**
 * Displays auth error messages in a consistent Alert format
 * Maps Supabase error codes to user-friendly Polish messages
 */
export function AuthErrorAlert({ error, className }: AuthErrorAlertProps) {
  if (!error) return null;

  const message = mapAuthErrorToMessage(error);

  return (
    <Alert variant="destructive" className={className}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <p className="text-sm">{message}</p>
      </div>
    </Alert>
  );
}
