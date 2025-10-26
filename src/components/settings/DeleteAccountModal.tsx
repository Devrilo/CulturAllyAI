import { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { deleteAccountSchema, type DeleteAccountFormData } from "../../lib/validators/auth";
import { supabaseClient } from "../../db/supabase.client";
import type { AuthError } from "@supabase/supabase-js";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { AuthErrorAlert } from "../auth/AuthErrorAlert";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for deleting user account
 * Requires password confirmation and explicit consent
 * Triggers backend endpoint that uses Supabase Admin API
 */
export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [formData, setFormData] = useState<DeleteAccountFormData>({
    password: "",
    confirmDeletion: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DeleteAccountFormData, string>>>({});
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: keyof DeleteAccountFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setAuthError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setFormData({ password: "", confirmDeletion: false });
      setErrors({});
      setAuthError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setErrors({});
      setAuthError(null);

      // Validate form
      const validation = deleteAccountSchema.safeParse(formData);
      if (!validation.success) {
        const fieldErrors: Partial<Record<keyof DeleteAccountFormData, string>> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof DeleteAccountFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        // Call backend endpoint to delete account
        // Backend will verify password and use Supabase Admin API to delete user
        const response = await fetch("/api/auth/delete-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            password: formData.password,
            confirmDeletion: formData.confirmDeletion,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Błąd serwera" }));
          throw new Error(errorData.message || errorData.error || "Nie udało się usunąć konta");
        }

        // Sign out and redirect
        await supabaseClient.auth.signOut();
        window.location.href = "/?message=account_deleted";
      } catch (err) {
        setAuthError(err as AuthError);
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <h2 id="delete-account-title" className="text-xl font-semibold">
              Usuń konto
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} disabled={isSubmitting} aria-label="Zamknij">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthErrorAlert error={authError} />

          {/* Warning */}
          <div className="w-full rounded-md border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-foreground">
              <strong>Uwaga:</strong> Ta operacja jest nieodwracalna. Twoje konto zostanie trwale usunięte, ale zapisane
              wydarzenia będą anonimizowane i zachowane dla celów statystycznych.
            </p>
          </div>

          {/* Password confirmation */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Potwierdź hasłem <span className="text-destructive">*</span>
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

          {/* Consent checkbox */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                id="confirmDeletion"
                checked={formData.confirmDeletion}
                onCheckedChange={(checked) => handleInputChange("confirmDeletion", checked)}
                disabled={isSubmitting}
                aria-invalid={!!errors.confirmDeletion}
                aria-describedby={errors.confirmDeletion ? "confirmDeletion-error" : undefined}
              />
              <span className="text-sm font-normal leading-tight select-none">
                Rozumiem, że ta operacja jest nieodwracalna i chcę trwale usunąć moje konto{" "}
                <span className="text-destructive">*</span>
              </span>
            </label>
            {errors.confirmDeletion && (
              <p id="confirmDeletion-error" className="text-sm text-destructive" role="alert">
                {errors.confirmDeletion}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1">
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting}
              className="flex-1"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Usuwam...
                </>
              ) : (
                "Usuń konto"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
