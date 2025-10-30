import { useState, useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { supabaseClient } from "../../db/supabase.client";
import {
  registerSchema,
  type RegisterFormData,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "../../lib/validators/auth";
import type { AuthError } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

/**
 * Registration form component with password strength indicator
 * Handles user signup via Supabase Auth with redirect to login
 */
export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate password strength
  const passwordStrength = useMemo(() => calculatePasswordStrength(formData.password), [formData.password]);

  const handleInputChange = useCallback((field: keyof RegisterFormData, value: string) => {
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
      const validation = registerSchema.safeParse(formData);
      if (!validation.success) {
        const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        // Sign up with Supabase Auth
        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) {
          setAuthError(signUpError);
          setIsSubmitting(false);
          return;
        }

        // Registration successful - redirect to login
        if (signUpData.user) {
          // Show success message and redirect to login immediately
          // Don't wait for activity log - it can fail since user session not yet established
          window.location.href = "/login?message=registration_success";

          // Log activity after redirect (fire and forget - will likely fail but that's ok)
          fetch("/api/auth/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action_type: "account_created" }),
          }).catch(() => {
            // Ignore audit log errors - user not yet logged in
          });
        }
      } catch (err) {
        setAuthError(err as AuthError);
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formularz rejestracji">
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

      {/* Password with strength indicator */}
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
          aria-describedby={errors.password ? "password-error" : "password-strength"}
          className={errors.password ? "border-destructive" : ""}
          autoComplete="new-password"
        />

        {/* Password strength indicator */}
        {formData.password && (
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

        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password}
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
