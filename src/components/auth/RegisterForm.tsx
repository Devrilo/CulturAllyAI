import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { Loader2 } from "lucide-react";

/**
 * Registration form component with password strength indicator
 * Handles user signup via Supabase Auth with redirect to login
 */
export function RegisterForm() {
  const { register, handleSubmit, errors, watch, authError, isSubmitting, onSubmit } = useRegisterForm();

  const password = watch("password");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Formularz rejestracji">
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
          {...register("email")}
          disabled={isSubmitting}
          placeholder="twoj@email.pl"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={errors.email ? "border-destructive" : ""}
          autoComplete="email"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password with strength indicator */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Hasło <span className="text-destructive">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          disabled={isSubmitting}
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : "password-strength"}
          className={errors.password ? "border-destructive" : ""}
          autoComplete="new-password"
        />

        <PasswordStrengthIndicator password={password} />

        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
        {!errors.password && <p className="text-xs text-muted-foreground">Minimum 8 znaków, w tym litera i cyfra</p>}
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

      {/* Submit button */}
      <Button type="submit" disabled={isSubmitting} className="w-full" aria-busy={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Rejestracja...
          </>
        ) : (
          "Utwórz konto"
        )}
      </Button>
    </form>
  );
}
