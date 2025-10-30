import { useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, X } from "lucide-react";
import { AuthErrorAlert } from "../auth/AuthErrorAlert";
import { PasswordStrengthIndicator } from "../auth/PasswordStrengthIndicator";
import { useChangePasswordForm } from "../hooks/useChangePasswordForm";

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
  const { register, handleSubmit, errors, watch, authError, isSubmitting, onSubmit, clearAuthError } =
    useChangePasswordForm();

  const newPassword = watch("newPassword");

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      clearAuthError();
      onClose();
    }
  }, [isSubmitting, clearAuthError, onClose]);

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthErrorAlert error={authError} />

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              Aktualne hasło <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currentPassword"
              type="password"
              {...register("currentPassword")}
              disabled={isSubmitting}
              placeholder="••••••••"
              aria-invalid={!!errors.currentPassword}
              aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
              className={errors.currentPassword ? "border-destructive" : ""}
              autoComplete="current-password"
            />
            {errors.currentPassword && (
              <p id="currentPassword-error" className="text-sm text-destructive" role="alert">
                {errors.currentPassword.message}
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
              {...register("newPassword")}
              disabled={isSubmitting}
              placeholder="••••••••"
              aria-invalid={!!errors.newPassword}
              aria-describedby={errors.newPassword ? "newPassword-error" : "password-strength"}
              className={errors.newPassword ? "border-destructive" : ""}
              autoComplete="new-password"
            />

            <PasswordStrengthIndicator password={newPassword} />

            {errors.newPassword && (
              <p id="newPassword-error" className="text-sm text-destructive" role="alert">
                {errors.newPassword.message}
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
              {...register("confirmPassword")}
              disabled={isSubmitting}
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              className={errors.confirmPassword ? "border-destructive" : ""}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
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
