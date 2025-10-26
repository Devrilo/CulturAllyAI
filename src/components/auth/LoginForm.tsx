import { useState, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { useAuthRedirect } from "../hooks/useAuthRedirect";
import { supabaseClient } from "../../db/supabase.client";
import { loginSchema, type LoginFormData } from "../../lib/validators/auth";
import type { AuthError } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

/**
 * Login form component
 * Handles email/password authentication via Supabase Auth
 */
export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { navigateToRedirect } = useAuthRedirect();

  // Check for success message in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    if (message === "registration_success") {
      setSuccessMessage("Rejestracja przebiegła pomyślnie! Możesz się teraz zalogować.");
      // Clean up URL
      window.history.replaceState({}, "", "/login");
    } else if (message === "password_changed") {
      setSuccessMessage("Hasło zostało zmienione. Zaloguj się używając nowego hasła.");
      // Clean up URL
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const handleInputChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setAuthError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setErrors({});
      setAuthError(null);

      // Validate form
      const validation = loginSchema.safeParse(formData);
      if (!validation.success) {
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        // Call Supabase Auth
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          setAuthError(error);
          setIsSubmitting(false);
          return;
        }

        if (data.session) {
          // Optional: Log activity (fire and forget)
          fetch("/api/auth/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action_type: "login" }),
          }).catch(() => {
            // Ignore audit log errors
          });

          // Redirect to target page
          navigateToRedirect();
        }
      } catch (err) {
        setAuthError(err as AuthError);
        setIsSubmitting(false);
      }
    },
    [formData, navigateToRedirect]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formularz logowania">
      {/* Success message */}
      {successMessage && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Auth error alert */}
      <AuthErrorAlert error={authError} />

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          disabled={isSubmitting}
          placeholder="twoj@email.pl"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={errors.email ? "border-destructive" : ""}
          autoComplete="email"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Hasło <span className="text-destructive">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          disabled={isSubmitting}
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          className={errors.password ? "border-destructive" : ""}
          autoComplete="current-password"
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button type="submit" disabled={isSubmitting} className="w-full" aria-busy={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Logowanie...
          </>
        ) : (
          "Zaloguj się"
        )}
      </Button>
    </form>
  );
}
