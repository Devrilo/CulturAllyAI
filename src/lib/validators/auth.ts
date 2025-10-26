import { z } from "zod";

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email jest wymagany")
  .email("Nieprawidłowy format email")
  .max(255, "Email nie może być dłuższy niż 255 znaków");

/**
 * Password validation schema
 * Minimum 8 characters, at least one letter and one number
 */
export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .max(128, "Hasło nie może być dłuższe niż 128 znaków")
  .regex(/[a-zA-Z]/, "Hasło musi zawierać przynajmniej jedną literę")
  .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę");

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Registration form validation schema
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Change password form validation schema
 * Requires current password for verification
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Nowe hasło musi być inne niż obecne",
    path: ["newPassword"],
  });

/**
 * Delete account form validation schema
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Hasło jest wymagane do potwierdzenia"),
  confirmDeletion: z.boolean().refine((val) => val === true, {
    message: "Musisz potwierdzić usunięcie konta",
  }),
});

/**
 * Auth activity log validation schema
 */
export const authActivitySchema = z.object({
  action_type: z.enum(["login", "logout", "account_created", "password_changed", "account_deleted"]),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Type exports for TypeScript
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
export type AuthActivityData = z.infer<typeof authActivitySchema>;

/**
 * Password strength calculation
 * Returns score from 0 (very weak) to 4 (very strong)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  return Math.min(score, 4);
}

/**
 * Get password strength label based on score
 */
export function getPasswordStrengthLabel(score: number): string {
  const labels = ["Bardzo słabe", "Słabe", "Średnie", "Silne", "Bardzo silne"];
  return labels[score] || labels[0];
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(score: number): string {
  const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600"];
  return colors[score] || colors[0];
}
