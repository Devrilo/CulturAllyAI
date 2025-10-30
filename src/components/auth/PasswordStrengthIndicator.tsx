import { useMemo } from "react";
import {
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "../../lib/validators/auth";

interface PasswordStrengthIndicatorProps {
  password: string;
}

/**
 * Reusable password strength indicator component
 * Shows visual strength bars and label
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
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
  );
}
