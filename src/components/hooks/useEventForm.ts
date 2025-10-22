import { useState, useCallback, useRef, useEffect } from "react";
import { z } from "zod";
import { createEventSchema } from "../../lib/validators/events";
import type { EventFormValues, EventFormErrors } from "../../types";

interface UseEventFormReturn {
  values: EventFormValues;
  errors: EventFormErrors;
  isValid: boolean;
  updateField: <K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) => void;
  validateAll: () => boolean;
  reset: () => void;
}

const DEBOUNCE_MS = 300;

const initialValues: EventFormValues = {
  title: "",
  event_date: "",
  city: "",
  category: "" as EventFormValues["category"],
  age_category: "" as EventFormValues["age_category"],
  key_information: "",
};

/**
 * Hook for managing event form state with Zod validation and debouncing
 *
 * @returns Form state, validation errors, and control methods
 */
export function useEventForm(): UseEventFormReturn {
  const [values, setValues] = useState<EventFormValues>(initialValues);
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [isValid, setIsValid] = useState(false);

  // Refs for debouncing
  const debounceTimers = useRef<Partial<Record<keyof EventFormValues, NodeJS.Timeout>>>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  /**
   * Validate a single field
   */
  const validateField = useCallback((field: keyof EventFormValues, value: EventFormValues[keyof EventFormValues]) => {
    try {
      // Pick only the field we want to validate from schema
      const fieldSchema = createEventSchema.shape[field];
      fieldSchema.parse(value);

      // Clear error for this field
      setErrors((prev) => {
        const next = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete next[field];
        return next;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors[0]?.message || "Nieprawidłowa wartość";
        setErrors((prev) => ({
          ...prev,
          [field]: fieldError,
        }));
      }
    }
  }, []);

  /**
   * Validate all fields synchronously
   */
  const validateAll = useCallback((): boolean => {
    try {
      createEventSchema.parse(values);
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: EventFormErrors = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof EventFormValues;
          if (field) {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
        setIsValid(false);
        return false;
      }
      return false;
    }
  }, [values]);

  /**
   * Update a form field with debounced validation
   */
  const updateField = useCallback(
    <K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) => {
      // Update value immediately
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear existing debounce timer for this field
      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
      }

      // Set new debounce timer
      debounceTimers.current[field] = setTimeout(() => {
        validateField(field, value);
      }, DEBOUNCE_MS);
    },
    [validateField]
  );

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsValid(false);

    // Clear all debounce timers
    Object.values(debounceTimers.current).forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
    debounceTimers.current = {};
  }, []);

  // Re-validate on values change (for isValid state)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        createEventSchema.parse(values);
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [values]);

  return {
    values,
    errors,
    isValid,
    updateField,
    validateAll,
    reset,
  };
}
