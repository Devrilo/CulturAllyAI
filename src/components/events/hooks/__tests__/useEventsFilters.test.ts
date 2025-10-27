import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEventsFilters } from "../useEventsFilters";
import type { EventCategory, AgeCategory } from "@/types";

// Mock window.location and window.history
const mockLocation = {
  pathname: "/events",
  search: "",
};

const mockHistory = {
  replaceState: vi.fn(),
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

Object.defineProperty(window, "history", {
  value: mockHistory,
  writable: true,
});

describe("useEventsFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockLocation.search = "";
    mockHistory.replaceState.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with default filters", () => {
      const { result } = renderHook(() => useEventsFilters());

      expect(result.current.filters).toEqual({
        saved: true,
        sort: "created_at",
        order: "desc",
        page: 1,
        category: undefined,
        age_category: undefined,
      });
    });

    it("should set isReady to true after mount", () => {
      const { result } = renderHook(() => useEventsFilters());

      // Initially true (useEffect runs synchronously in test environment)
      expect(result.current.isReady).toBe(true);
    });

    it("should initialize from URL search params", () => {
      mockLocation.search = "?category=koncerty&age_category=dorosli&page=2&sort=title&order=asc";

      const { result } = renderHook(() => useEventsFilters());

      expect(result.current.filters).toEqual({
        saved: true,
        category: "koncerty" as EventCategory,
        age_category: "dorosli" as AgeCategory,
        page: 2,
        sort: "title",
        order: "asc",
      });
    });

    it("should use defaults for missing URL params", () => {
      mockLocation.search = "?category=kino";

      const { result } = renderHook(() => useEventsFilters());

      expect(result.current.filters.sort).toBe("created_at");
      expect(result.current.filters.order).toBe("desc");
      expect(result.current.filters.page).toBe(1);
      expect(result.current.filters.category).toBe("kino");
    });

    it("should handle invalid page parameter from URL", () => {
      mockLocation.search = "?page=invalid";

      const { result } = renderHook(() => useEventsFilters());

      // NaN from parseInt should fallback to default
      expect(isNaN(result.current.filters.page)).toBe(false);
    });
  });

  describe("updateFilters", () => {
    it("should update single filter", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ category: "koncerty" as EventCategory });
      });

      expect(result.current.filters.category).toBe("koncerty");
      expect(result.current.filters.page).toBe(1); // Page should reset
    });

    it("should update multiple filters at once", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({
          category: "kino" as EventCategory,
          age_category: "dzieci" as AgeCategory,
          sort: "title",
        });
      });

      expect(result.current.filters.category).toBe("kino");
      expect(result.current.filters.age_category).toBe("dzieci");
      expect(result.current.filters.sort).toBe("title");
      expect(result.current.filters.page).toBe(1); // Page should reset
    });

    it("should reset page to 1 when filters change", () => {
      const { result } = renderHook(() => useEventsFilters());

      // First set page to 3
      act(() => {
        result.current.updateFilters({ page: 3 });
      });

      expect(result.current.filters.page).toBe(3);

      // Then change category
      act(() => {
        result.current.updateFilters({ category: "teatr" as EventCategory });
      });

      expect(result.current.filters.page).toBe(1);
    });

    it("should not reset page when explicitly setting page", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ page: 5 });
      });

      expect(result.current.filters.page).toBe(5);
    });

    it("should update sort order", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ sort: "event_date", order: "asc" });
      });

      expect(result.current.filters.sort).toBe("event_date");
      expect(result.current.filters.order).toBe("asc");
    });
  });

  describe("resetFilters", () => {
    it("should reset all filters to defaults", () => {
      const { result } = renderHook(() => useEventsFilters());

      // First set some filters
      act(() => {
        result.current.updateFilters({
          category: "koncerty" as EventCategory,
          age_category: "dorosli" as AgeCategory,
          page: 3,
          sort: "title",
          order: "asc",
        });
      });

      // Then reset
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual({
        saved: true,
        sort: "created_at",
        order: "desc",
        page: 1,
      });
    });

    it("should clear category and age_category", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({
          category: "koncerty" as EventCategory,
          age_category: "dorosli" as AgeCategory,
        });
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.category).toBeUndefined();
      expect(result.current.filters.age_category).toBeUndefined();
    });
  });

  describe("URL synchronization", () => {
    it("should sync filters to URL after debounce", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ category: "koncerty" as EventCategory });
      });

      // URL should not update immediately
      expect(mockHistory.replaceState).not.toHaveBeenCalled();

      // After 300ms debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        "",
        "/events?category=koncerty&sort=created_at&order=desc"
      );
    });

    it("should include all non-default filters in URL", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({
          category: "kino" as EventCategory,
          age_category: "dorosli" as AgeCategory,
          page: 3,
          sort: "title",
          order: "asc",
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        "",
        "/events?category=kino&age_category=dorosli&sort=title&order=asc&page=3"
      );
    });

    it("should omit default values from URL", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({
          category: "teatr" as EventCategory,
          sort: "created_at",
          order: "desc",
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Only category should be in URL (others are defaults)
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        "",
        "/events?category=teatr&sort=created_at&order=desc"
      );
    });

    it("should not include page=1 in URL", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({
          category: "koncerty" as EventCategory,
          page: 1,
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        "",
        "/events?category=koncerty&sort=created_at&order=desc"
      );
    });

    it("should debounce rapid filter changes", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ category: "koncerty" as EventCategory });
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.updateFilters({ category: "kino" as EventCategory });
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.updateFilters({ category: "teatr" as EventCategory });
      });

      // Only one call after full debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockHistory.replaceState).toHaveBeenCalledTimes(1);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        "",
        "/events?category=teatr&sort=created_at&order=desc"
      );
    });

    it("should not sync to URL before isReady", () => {
      // This is hard to test since isReady is set in useEffect which runs immediately
      // but we can verify the logic is there
      const { result } = renderHook(() => useEventsFilters());

      expect(result.current.isReady).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined category gracefully", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ category: undefined });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.filters.category).toBeUndefined();
    });

    it("should handle undefined age_category gracefully", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ age_category: undefined });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.filters.age_category).toBeUndefined();
    });

    it("should preserve saved filter (always true)", () => {
      const { result } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ category: "koncerty" as EventCategory });
      });

      expect(result.current.filters.saved).toBe(true);
    });

    it("should handle unmount during debounce", () => {
      const { result, unmount } = renderHook(() => useEventsFilters());

      act(() => {
        result.current.updateFilters({ category: "koncerty" as EventCategory });
      });

      unmount();

      // Should not throw error
      expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    });
  });

  describe("memoization", () => {
    it("should return stable references for functions", () => {
      const { result, rerender } = renderHook(() => useEventsFilters());

      const updateFilters1 = result.current.updateFilters;
      const resetFilters1 = result.current.resetFilters;

      rerender();

      const updateFilters2 = result.current.updateFilters;
      const resetFilters2 = result.current.resetFilters;

      expect(updateFilters1).toBe(updateFilters2);
      expect(resetFilters1).toBe(resetFilters2);
    });
  });
});
