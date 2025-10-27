import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEventForm } from "../useEventForm";
import type { EventFormValues } from "@/types";

describe("useEventForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with empty values", () => {
      const { result } = renderHook(() => useEventForm());

      expect(result.current.values).toEqual({
        title: "",
        event_date: "",
        city: "",
        category: "",
        age_category: "",
        key_information: "",
      });
    });

    it("should initialize with no errors", () => {
      const { result } = renderHook(() => useEventForm());

      expect(result.current.errors).toEqual({});
    });

    it("should initialize with isValid as false", () => {
      const { result } = renderHook(() => useEventForm());

      expect(result.current.isValid).toBe(false);
    });
  });

  describe("updateField", () => {
    it("should update field value immediately", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "Test Event");
      });

      expect(result.current.values.title).toBe("Test Event");
    });

    it("should update multiple fields independently", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "Test Event");
        result.current.updateField("city", "Warsaw");
        result.current.updateField("category", "koncerty");
      });

      expect(result.current.values.title).toBe("Test Event");
      expect(result.current.values.city).toBe("Warsaw");
      expect(result.current.values.category).toBe("koncerty");
    });

    it("should debounce validation by 300ms", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "Test");
      });

      // Error should not be set immediately
      expect(result.current.errors.title).toBeUndefined();

      // After 300ms, validation should run
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.title).toBeUndefined();
    });

    it("should cancel previous debounce timer on rapid changes", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "");
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.updateField("title", "Valid Title");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not have error for valid title
      expect(result.current.errors.title).toBeUndefined();
    });
  });

  describe("validateField", () => {
    it("should validate title field and set error for empty value", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.title).toBe("Tytuł jest wymagany");
    });

    it("should validate title field and clear error for valid value", () => {
      const { result } = renderHook(() => useEventForm());

      // First set invalid value
      act(() => {
        result.current.updateField("title", "");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.title).toBeDefined();

      // Then set valid value
      act(() => {
        result.current.updateField("title", "Valid Title");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.title).toBeUndefined();
    });

    it("should validate city field for max length", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("city", "a".repeat(51));
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.city).toBe("Miasto nie może przekraczać 50 znaków");
    });

    it("should validate key_information for max length", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("key_information", "a".repeat(201));
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.key_information).toBe("Kluczowe informacje nie mogą przekraczać 200 znaków");
    });
  });

  describe("validateAll", () => {
    it("should validate all fields and return false for empty form", () => {
      const { result } = renderHook(() => useEventForm());

      let isValid = false;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(false);
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    });

    it("should validate all fields and return true for valid form", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "Test Event");
        result.current.updateField("city", "Warsaw");
        result.current.updateField("event_date", new Date(Date.now() + 86400000).toISOString());
        result.current.updateField("category", "koncerty");
        result.current.updateField("age_category", "dorosli");
        result.current.updateField("key_information", "Important info");
      });

      let isValid = false;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it("should set errors for all invalid fields", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "");
        result.current.updateField("city", "");
        result.current.updateField("event_date", "");
        result.current.updateField("category", "" as EventFormValues["category"]);
        result.current.updateField("age_category", "" as EventFormValues["age_category"]);
        result.current.updateField("key_information", "");
      });

      act(() => {
        result.current.validateAll();
      });

      expect(result.current.errors).toHaveProperty("title");
      expect(result.current.errors).toHaveProperty("city");
      expect(result.current.errors).toHaveProperty("event_date");
      expect(result.current.errors).toHaveProperty("category");
      expect(result.current.errors).toHaveProperty("age_category");
      expect(result.current.errors).toHaveProperty("key_information");
    });

    it("should update isValid state when validation passes", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "Test Event");
        result.current.updateField("city", "Warsaw");
        result.current.updateField("event_date", new Date(Date.now() + 86400000).toISOString());
        result.current.updateField("category", "koncerty");
        result.current.updateField("age_category", "dorosli");
        result.current.updateField("key_information", "Important info");
      });

      act(() => {
        result.current.validateAll();
      });

      expect(result.current.isValid).toBe(true);
    });

    it("should update isValid state when validation fails", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "");
      });

      act(() => {
        result.current.validateAll();
      });

      expect(result.current.isValid).toBe(false);
    });
  });

  describe("reset", () => {
    it("should reset all values to initial state", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "Test Event");
        result.current.updateField("city", "Warsaw");
        result.current.updateField("category", "koncerty");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual({
        title: "",
        event_date: "",
        city: "",
        category: "",
        age_category: "",
        key_information: "",
      });
    });

    it("should clear all errors", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.validateAll();
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
    });

    it("should reset isValid to false", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "Test Event");
        result.current.updateField("city", "Warsaw");
        result.current.updateField("event_date", new Date(Date.now() + 86400000).toISOString());
        result.current.updateField("category", "koncerty");
        result.current.updateField("age_category", "dorosli");
        result.current.updateField("key_information", "Important info");
        result.current.validateAll();
      });

      // Note: isValid remains false because useEffect debounce hasn't fired yet
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isValid).toBe(false);
    });

    it("should clear all debounce timers", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "");
      });

      act(() => {
        result.current.reset();
      });

      // Advance timers - validation should not happen
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.title).toBeUndefined();
    });
  });

  describe("isValid state reactivity", () => {
    it("should automatically update isValid when values change", () => {
      const { result } = renderHook(() => useEventForm());

      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.updateField("title", "Test Event");
        result.current.updateField("city", "Warsaw");
        result.current.updateField("event_date", new Date(Date.now() + 86400000).toISOString());
        result.current.updateField("category", "koncerty");
        result.current.updateField("age_category", "dorosli");
        result.current.updateField("key_information", "Important info");
      });

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // isValid should be true after all valid values are set
      expect(result.current.isValid).toBe(true);
    });

    it("should update isValid to false when invalid value is set", () => {
      const { result } = renderHook(() => useEventForm());

      // First set all valid values
      act(() => {
        result.current.updateField("title", "Test Event");
        result.current.updateField("city", "Warsaw");
        result.current.updateField("event_date", new Date(Date.now() + 86400000).toISOString());
        result.current.updateField("category", "koncerty");
        result.current.updateField("age_category", "dorosli");
        result.current.updateField("key_information", "Important info");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(true);

      // Then set invalid value
      act(() => {
        result.current.updateField("title", "");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isValid).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid successive updateField calls", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "A");
        result.current.updateField("title", "AB");
        result.current.updateField("title", "ABC");
        result.current.updateField("title", "ABCD");
        result.current.updateField("title", "Final Title");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.values.title).toBe("Final Title");
      expect(result.current.errors.title).toBeUndefined();
    });

    it("should handle validation during unmount", () => {
      const { result, unmount } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("title", "");
      });

      unmount();

      // Should not throw error
      expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    });

    it("should handle empty category enum as string", () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.updateField("category", "" as EventFormValues["category"]);
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.category).toBeDefined();
    });
  });
});
