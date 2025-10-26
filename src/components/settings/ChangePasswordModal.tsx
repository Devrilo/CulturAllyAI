import { useState, useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "../../lib/validators/auth";
import { supabaseClient } from "../../db/supabase.client";
import type { AuthError } from "@supabase/supabase-js";
import { Loader2, X } from "lucide-react";
import { AuthErrorAlert } from "../auth/AuthErrorAlert";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for changing user password
 * Does not require current password - verified by active JWT session
 * Auto-logout after successful password change
 */
export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState<ChangePasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordFormData, string>>>({});
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate password strength
  const passwordStrength = useMemo(() => calculatePasswordStrength(formData.newPassword), [formData.newPassword]);

  const handleInputChange = useCallback((field: keyof ChangePasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setAuthError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
      const validation = changePasswordSchema.safeParse(formData);
      if (!validation.success) {
        const fieldErrors: Partial<Record<keyof ChangePasswordFormData, string>> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ChangePasswordFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        // First verify current password
        const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
          email: (await supabaseClient.auth.getUser()).data.user?.email || "",
          password: formData.currentPassword,
        });

        if (verifyError) {
          setAuthError({ ...verifyError, message: "Nieprawidłowe aktualne hasło" } as AuthError);
          setIsSubmitting(false);
          return;
        }

        // Update password via Supabase Auth
        const { error } = await supabaseClient.auth.updateUser({
          password: formData.newPassword,
        });

        if (error) {
          setAuthError(error);
          setIsSubmitting(false);
          return;
        }

        // Log activity
        fetch("/api/auth/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action_type: "password_changed" }),
        }).catch(() => {
          // Ignore audit log errors
        });

        // Sign out and redirect to login
        await supabaseClient.auth.signOut();
        window.location.href = "/login?message=password_changed";
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
      aria-labelledby="change-password-title"
    >
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 id="change-password-title" className="text-xl font-semibold">
            Zmień hasło
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose} disabled={isSubmitting} aria-label="Zamknij">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthErrorAlert error={authError} />

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              Aktualne hasło <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              aria-invalid={!!errors.currentPassword}
              aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
              className={errors.currentPassword ? "border-destructive" : ""}
              autoComplete="current-password"
            />
            {errors.currentPassword && (
              <p id="currentPassword-error" className="text-sm text-destructive" role="alert">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              Nowe hasło <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              aria-invalid={!!errors.newPassword}
              aria-describedby={errors.newPassword ? "newPassword-error" : "password-strength"}
              className={errors.newPassword ? "border-destructive" : ""}
              autoComplete="new-password"
            />

            {/* Password strength indicator */}
            {formData.newPassword && (
              <div id="password-strength" className="space-y-1" aria-live="polite">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength ? getPasswordStrengthColor(passwordStrength) : "bg-muted"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Siła hasła: <span className="font-medium">{getPasswordStrengthLabel(passwordStrength)}</span>
                </p>
              </div>
            )}

            {errors.newPassword && (
              <p id="newPassword-error" className="text-sm text-destructive" role="alert">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Powtórz hasło <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              className={errors.confirmPassword ? "border-destructive" : ""}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Info notice */}
          <div className="w-full rounded-md border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              Po zmianie hasła zostaniesz automatycznie wylogowany i będziesz musiał zalogować się ponownie.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1">
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1" aria-busy={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Zmieniam...
                </>
              ) : (
                "Zmień hasło"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
