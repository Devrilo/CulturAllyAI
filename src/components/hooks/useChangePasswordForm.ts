import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback } from "react";
import { supabaseClient } from "../../db/supabase.client";
import { changePasswordSchema, type ChangePasswordFormData } from "../../lib/validators/auth";
import type { AuthError } from "@supabase/supabase-js";

export interface UseChangePasswordFormReturn {
  // Form control
  register: ReturnType<typeof useForm<ChangePasswordFormData>>["register"];
  handleSubmit: ReturnType<typeof useForm<ChangePasswordFormData>>["handleSubmit"];
  errors: ReturnType<typeof useForm<ChangePasswordFormData>>["formState"]["errors"];
  watch: ReturnType<typeof useForm<ChangePasswordFormData>>["watch"];

  // State
  authError: AuthError | null;
  isSubmitting: boolean;

  // Actions
  onSubmit: (data: ChangePasswordFormData) => Promise<void>;
  clearAuthError: () => void;
}

/**
 * Custom hook for change password form with React Hook Form
 * Handles validation, submission, and password update via Supabase Auth
 */
export function useChangePasswordForm(): UseChangePasswordFormReturn {
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const onSubmit = useCallback(async (data: ChangePasswordFormData) => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
      // First verify current password
      const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
        email: (await supabaseClient.auth.getUser()).data.user?.email || "",
        password: data.currentPassword,
      });

      if (verifyError) {
        setAuthError({ ...verifyError, message: "Nieprawidłowe aktualne hasło" } as AuthError);
        setIsSubmitting(false);
        return;
      }

      // Update password via Supabase Auth
      const { error } = await supabaseClient.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        setAuthError(error);
        setIsSubmitting(false);
        return;
      }

      // Log activity (fire and forget - don't wait for response)
      fetch("/api/auth/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_type: "password_changed" }),
      }).catch(() => {
        // Ignore audit log errors
      });

      // Sign out and redirect to login immediately
      // Do this synchronously to avoid race conditions with React state updates
      await supabaseClient.auth.signOut();
      
      // Redirect immediately after signOut completes
      // Using window.location.href ensures immediate redirect without React state dependency
      if (typeof window !== "undefined") {
        window.location.href = "/login?message=password_changed";
      }
    } catch (err) {
      setAuthError(err as AuthError);
      setIsSubmitting(false);
    }
  }, []);

  return {
    register,
    handleSubmit,
    errors,
    watch,
    authError,
    isSubmitting,
    onSubmit,
    clearAuthError,
  };
}
