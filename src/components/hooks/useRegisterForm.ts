import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback, useEffect } from "react";
import { supabaseClient } from "../../db/supabase.client";
import { registerSchema, type RegisterFormData } from "../../lib/validators/auth";
import type { AuthError } from "@supabase/supabase-js";

export interface UseRegisterFormReturn {
  // Form control
  register: ReturnType<typeof useForm<RegisterFormData>>["register"];
  handleSubmit: ReturnType<typeof useForm<RegisterFormData>>["handleSubmit"];
  errors: ReturnType<typeof useForm<RegisterFormData>>["formState"]["errors"];
  watch: ReturnType<typeof useForm<RegisterFormData>>["watch"];

  // State
  authError: AuthError | null;
  isSubmitting: boolean;

  // Actions
  onSubmit: (data: RegisterFormData) => Promise<void>;
  clearAuthError: () => void;
}

/**
 * Custom hook for registration form with React Hook Form
 * Handles validation, submission, and user signup via Supabase Auth
 */
export function useRegisterForm(): UseRegisterFormReturn {
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Effect to handle redirect after registration
  useEffect(() => {
    if (shouldRedirect && typeof window !== "undefined") {
      window.location.href = "/login?message=registration_success";
    }
  }, [shouldRedirect]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
      // Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        setAuthError(signUpError);
        setIsSubmitting(false);
        return;
      }

      // Registration successful - redirect to login
      if (signUpData.user) {
        // Log activity (fire and forget - will likely fail but that's ok)
        fetch("/api/auth/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action_type: "account_created" }),
        }).catch(() => {
          // Ignore audit log errors - user not yet logged in
        });

        // Show success message and redirect to login
        setShouldRedirect(true);
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
