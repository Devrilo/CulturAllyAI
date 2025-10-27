import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mapEventToViewModel } from "../utils";
import type { EventListItemDTO, EventCategoryDTO, AgeCategoryDTO } from "@/types";

describe("mapEventToViewModel", () => {
  const mockCategories: EventCategoryDTO[] = [
    { value: "koncerty", label: "Koncerty" },
    { value: "teatr_i_taniec", label: "Teatr i taniec" },
    { value: "kino", label: "Kino" },
  ];

  const mockAgeCategories: AgeCategoryDTO[] = [
    { value: "dorosli", label: "Dorośli" },
    { value: "dzieci", label: "Dzieci" },
    { value: "nastolatkowie", label: "Nastolatkowie" },
  ];

  const baseEventDTO: EventListItemDTO = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Test Event",
    city: "Warsaw",
    event_date: "2025-11-15T19:00:00Z",
    category: "koncerty",
    age_category: "dorosli",
    key_information: "Important details",
    generated_description: "Generated event description",
    edited_description: null,
    feedback: null,
    saved: true,
    user_id: "user-123",
    created_by_authenticated_user: true,
    created_at: "2025-10-27T10:00:00Z",
    updated_at: "2025-10-27T10:00:00Z",
  };

  beforeEach(() => {
    // Mock Intl.DateTimeFormat to have consistent results
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-10-27T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("basic field mapping", () => {
    it("should map all basic fields correctly", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result.id).toBe(baseEventDTO.id);
      expect(result.title).toBe(baseEventDTO.title);
      expect(result.city).toBe(baseEventDTO.city);
      expect(result.eventDateISO).toBe(baseEventDTO.event_date);
      expect(result.category).toBe(baseEventDTO.category);
      expect(result.ageCategory).toBe(baseEventDTO.age_category);
      expect(result.keyInformation).toBe(baseEventDTO.key_information);
      expect(result.feedback).toBe(baseEventDTO.feedback);
      expect(result.saved).toBe(baseEventDTO.saved);
      expect(result.createdAt).toBe(baseEventDTO.created_at);
      expect(result.updatedAt).toBe(baseEventDTO.updated_at);
    });
  });

  describe("description field selection", () => {
    it("should use generated_description when edited_description is null", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result.description).toBe("Generated event description");
      expect(result.editedDescription).toBeNull();
    });

    it("should use edited_description when provided", () => {
      const eventWithEdit: EventListItemDTO = {
        ...baseEventDTO,
        edited_description: "Custom edited description",
      };

      const result = mapEventToViewModel(eventWithEdit, mockCategories, mockAgeCategories);

      expect(result.description).toBe("Custom edited description");
      expect(result.editedDescription).toBe("Custom edited description");
    });
  });

  describe("category label mapping", () => {
    it("should map category value to label", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result.categoryLabel).toBe("Koncerty");
    });

    it("should fallback to category value when label not found", () => {
      const eventWithUnknownCategory: EventListItemDTO = {
        ...baseEventDTO,
        category: "unknown_category" as any,
      };

      const result = mapEventToViewModel(eventWithUnknownCategory, mockCategories, mockAgeCategories);

      expect(result.categoryLabel).toBe("unknown_category");
    });

    it("should handle empty categories array", () => {
      const result = mapEventToViewModel(baseEventDTO, [], mockAgeCategories);

      expect(result.categoryLabel).toBe("koncerty");
    });
  });

  describe("age category label mapping", () => {
    it("should map age_category value to label", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result.ageCategoryLabel).toBe("Dorośli");
    });

    it("should fallback to age_category value when label not found", () => {
      const eventWithUnknownAge: EventListItemDTO = {
        ...baseEventDTO,
        age_category: "unknown_age" as any,
      };

      const result = mapEventToViewModel(eventWithUnknownAge, mockCategories, mockAgeCategories);

      expect(result.ageCategoryLabel).toBe("unknown_age");
    });

    it("should handle empty age categories array", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, []);

      expect(result.ageCategoryLabel).toBe("dorosli");
    });
  });

  describe("date formatting", () => {
    it("should format event date in Polish format", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      // Polish format: "day month year" e.g., "15 listopada 2025"
      expect(result.eventDateLabel).toMatch(/^\d{1,2}\s\w+\s\d{4}$/);
      expect(result.eventDateLabel).toContain("2025");
    });

    it("should handle different dates correctly", () => {
      const eventWithDifferentDate: EventListItemDTO = {
        ...baseEventDTO,
        event_date: "2025-06-15T12:00:00Z",
      };

      const result = mapEventToViewModel(eventWithDifferentDate, mockCategories, mockAgeCategories);

      // Check that date formatting works (Polish month name should be present)
      expect(result.eventDateLabel).toMatch(/^\d{1,2}\s\w+\s2025$/);
    });
  });

  describe("isGuestOwned flag", () => {
    it("should set isGuestOwned to false when user_id is present", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result.isGuestOwned).toBe(false);
    });

    it("should set isGuestOwned to true when user_id is null", () => {
      const guestEvent: EventListItemDTO = {
        ...baseEventDTO,
        user_id: null,
      };

      const result = mapEventToViewModel(guestEvent, mockCategories, mockAgeCategories);

      expect(result.isGuestOwned).toBe(true);
    });
  });

  describe("character count calculation", () => {
    it("should calculate charCount based on generated_description", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result.charCount).toBe("Generated event description".length);
    });

    it("should calculate charCount based on edited_description when present", () => {
      const eventWithEdit: EventListItemDTO = {
        ...baseEventDTO,
        edited_description: "Short edit",
      };

      const result = mapEventToViewModel(eventWithEdit, mockCategories, mockAgeCategories);

      expect(result.charCount).toBe("Short edit".length);
    });

    it("should handle empty edited_description", () => {
      const eventWithEmptyEdit: EventListItemDTO = {
        ...baseEventDTO,
        edited_description: "",
      };

      const result = mapEventToViewModel(eventWithEmptyEdit, mockCategories, mockAgeCategories);

      // Empty edited_description means it uses generated_description
      expect(result.charCount).toBe("Generated event description".length);
    });

    it("should handle very long descriptions", () => {
      const longDescription = "a".repeat(500);
      const eventWithLongDesc: EventListItemDTO = {
        ...baseEventDTO,
        edited_description: longDescription,
      };

      const result = mapEventToViewModel(eventWithLongDesc, mockCategories, mockAgeCategories);

      expect(result.charCount).toBe(500);
    });
  });

  describe("feedback field", () => {
    it("should map thumbs_up feedback", () => {
      const eventWithFeedback: EventListItemDTO = {
        ...baseEventDTO,
        feedback: "thumbs_up",
      };

      const result = mapEventToViewModel(eventWithFeedback, mockCategories, mockAgeCategories);

      expect(result.feedback).toBe("thumbs_up");
    });

    it("should map thumbs_down feedback", () => {
      const eventWithFeedback: EventListItemDTO = {
        ...baseEventDTO,
        feedback: "thumbs_down",
      };

      const result = mapEventToViewModel(eventWithFeedback, mockCategories, mockAgeCategories);

      expect(result.feedback).toBe("thumbs_down");
    });

    it("should handle null feedback", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result.feedback).toBeNull();
    });
  });

  describe("saved field", () => {
    it("should map saved=true", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result.saved).toBe(true);
    });

    it("should map saved=false", () => {
      const unsavedEvent: EventListItemDTO = {
        ...baseEventDTO,
        saved: false,
      };

      const result = mapEventToViewModel(unsavedEvent, mockCategories, mockAgeCategories);

      expect(result.saved).toBe(false);
    });
  });

  describe("complete transformation", () => {
    it("should create a complete SavedEventViewModel", () => {
      const result = mapEventToViewModel(baseEventDTO, mockCategories, mockAgeCategories);

      expect(result).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        city: expect.any(String),
        eventDateISO: expect.any(String),
        eventDateLabel: expect.any(String),
        category: expect.any(String),
        categoryLabel: expect.any(String),
        ageCategory: expect.any(String),
        ageCategoryLabel: expect.any(String),
        keyInformation: expect.any(String),
        description: expect.any(String),
        editedDescription: null,
        feedback: null,
        saved: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        isGuestOwned: expect.any(Boolean),
        charCount: expect.any(Number),
      });
    });

    it("should handle event with all optional fields populated", () => {
      const completeEvent: EventListItemDTO = {
        ...baseEventDTO,
        edited_description: "Custom description",
        feedback: "thumbs_up",
        saved: true,
        user_id: "authenticated-user",
      };

      const result = mapEventToViewModel(completeEvent, mockCategories, mockAgeCategories);

      expect(result).toMatchInlineSnapshot(`
        {
          "ageCategory": "dorosli",
          "ageCategoryLabel": "Dorośli",
          "category": "koncerty",
          "categoryLabel": "Koncerty",
          "charCount": 18,
          "city": "Warsaw",
          "createdAt": "2025-10-27T10:00:00Z",
          "description": "Custom description",
          "editedDescription": "Custom description",
          "eventDateISO": "2025-11-15T19:00:00Z",
          "eventDateLabel": "15 listopada 2025",
          "feedback": "thumbs_up",
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "isGuestOwned": false,
          "keyInformation": "Important details",
          "saved": true,
          "title": "Test Event",
          "updatedAt": "2025-10-27T10:00:00Z",
        }
      `);
    });
  });
});
