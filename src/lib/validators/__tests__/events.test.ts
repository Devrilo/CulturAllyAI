import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createEventSchema, updateEventSchema, getUserEventsQuerySchema, getEventByIdParamsSchema } from "../events";

describe("createEventSchema", () => {
  const validEventData = {
    title: "Test Event",
    city: "Warsaw",
    event_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    category: "koncerty",
    age_category: "dorosli",
    key_information: "Important info about the event",
  };

  describe("title validation", () => {
    it("should accept valid title", () => {
      const result = createEventSchema.parse(validEventData);
      expect(result.title).toBe("Test Event");
    });

    it("should trim whitespace from title", () => {
      const result = createEventSchema.parse({
        ...validEventData,
        title: "  Trimmed Title  ",
      });
      expect(result.title).toBe("Trimmed Title");
    });

    it("should reject empty title", () => {
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          title: "",
        })
      ).toThrow("Tytuł jest wymagany");
    });

    it("should reject title exceeding 100 characters", () => {
      const longTitle = "a".repeat(101);
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          title: longTitle,
        })
      ).toThrow("Tytuł nie może przekraczać 100 znaków");
    });

    it("should accept title with exactly 100 characters", () => {
      const exactTitle = "a".repeat(100);
      const result = createEventSchema.parse({
        ...validEventData,
        title: exactTitle,
      });
      expect(result.title).toBe(exactTitle);
    });
  });

  describe("city validation", () => {
    it("should accept valid city", () => {
      const result = createEventSchema.parse(validEventData);
      expect(result.city).toBe("Warsaw");
    });

    it("should trim whitespace from city", () => {
      const result = createEventSchema.parse({
        ...validEventData,
        city: "  Krakow  ",
      });
      expect(result.city).toBe("Krakow");
    });

    it("should reject empty city", () => {
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          city: "",
        })
      ).toThrow("Miasto jest wymagane");
    });

    it("should reject city exceeding 50 characters", () => {
      const longCity = "a".repeat(51);
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          city: longCity,
        })
      ).toThrow("Miasto nie może przekraczać 50 znaków");
    });
  });

  describe("event_date validation", () => {
    beforeEach(() => {
      // Mock Date.now() to a fixed date for consistent testing
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-27T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should accept future date", () => {
      const futureDate = new Date("2025-10-28T12:00:00Z").toISOString();
      const result = createEventSchema.parse({
        ...validEventData,
        event_date: futureDate,
      });
      expect(result.event_date).toBe(futureDate);
    });

    it("should accept today's date", () => {
      const todayDate = new Date("2025-10-27T00:00:00Z").toISOString();
      const result = createEventSchema.parse({
        ...validEventData,
        event_date: todayDate,
      });
      expect(result.event_date).toBe(todayDate);
    });

    it("should reject past date", () => {
      const pastDate = new Date("2025-10-26T12:00:00Z").toISOString();
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          event_date: pastDate,
        })
      ).toThrow("Data wydarzenia nie może być w przeszłości");
    });

    it("should reject invalid ISO 8601 format", () => {
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          event_date: "2025-10-27",
        })
      ).toThrow("Data musi być w formacie ISO 8601");
    });

    it("should reject non-date strings", () => {
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          event_date: "not a date",
        })
      ).toThrow();
    });
  });

  describe("category validation", () => {
    it("should accept valid categories", () => {
      const validCategories = [
        "koncerty",
        "imprezy",
        "teatr_i_taniec",
        "sztuka_i_wystawy",
        "literatura",
        "kino",
        "festiwale",
        "inne",
      ];

      validCategories.forEach((category) => {
        const result = createEventSchema.parse({
          ...validEventData,
          category,
        });
        expect(result.category).toBe(category);
      });
    });

    it("should reject invalid category", () => {
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          category: "invalid_category",
        })
      ).toThrow("Nieprawidłowa kategoria wydarzenia");
    });
  });

  describe("age_category validation", () => {
    it("should accept valid age categories", () => {
      const validAgeCategories = [
        "wszystkie",
        "najmlodsi",
        "dzieci",
        "nastolatkowie",
        "mlodzi_dorosli",
        "dorosli",
        "osoby_starsze",
      ];

      validAgeCategories.forEach((age_category) => {
        const result = createEventSchema.parse({
          ...validEventData,
          age_category,
        });
        expect(result.age_category).toBe(age_category);
      });
    });

    it("should reject invalid age category", () => {
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          age_category: "invalid_age",
        })
      ).toThrow("Nieprawidłowa kategoria wiekowa");
    });
  });

  describe("key_information validation", () => {
    it("should accept valid key information", () => {
      const result = createEventSchema.parse(validEventData);
      expect(result.key_information).toBe("Important info about the event");
    });

    it("should trim whitespace from key_information", () => {
      const result = createEventSchema.parse({
        ...validEventData,
        key_information: "  Important info  ",
      });
      expect(result.key_information).toBe("Important info");
    });

    it("should reject empty key_information", () => {
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          key_information: "",
        })
      ).toThrow("Kluczowe informacje są wymagane");
    });

    it("should reject key_information exceeding 200 characters", () => {
      const longInfo = "a".repeat(201);
      expect(() =>
        createEventSchema.parse({
          ...validEventData,
          key_information: longInfo,
        })
      ).toThrow("Kluczowe informacje nie mogą przekraczać 200 znaków");
    });

    it("should accept key_information with exactly 200 characters", () => {
      const exactInfo = "a".repeat(200);
      const result = createEventSchema.parse({
        ...validEventData,
        key_information: exactInfo,
      });
      expect(result.key_information).toBe(exactInfo);
    });
  });
});

describe("updateEventSchema", () => {
  describe("saved field", () => {
    it("should accept boolean saved value", () => {
      const result = updateEventSchema.parse({ saved: true });
      expect(result.saved).toBe(true);

      const result2 = updateEventSchema.parse({ saved: false });
      expect(result2.saved).toBe(false);
    });
  });

  describe("feedback field", () => {
    it("should accept valid feedback values", () => {
      const result1 = updateEventSchema.parse({ feedback: "thumbs_up" });
      expect(result1.feedback).toBe("thumbs_up");

      const result2 = updateEventSchema.parse({ feedback: "thumbs_down" });
      expect(result2.feedback).toBe("thumbs_down");
    });

    it("should accept null feedback", () => {
      const result = updateEventSchema.parse({ feedback: null });
      expect(result.feedback).toBeNull();
    });

    it("should reject invalid feedback value", () => {
      expect(() => updateEventSchema.parse({ feedback: "invalid" })).toThrow();
    });
  });

  describe("edited_description field", () => {
    it("should accept valid edited_description", () => {
      const result = updateEventSchema.parse({
        edited_description: "New description",
      });
      expect(result.edited_description).toBe("New description");
    });

    it("should accept null edited_description", () => {
      const result = updateEventSchema.parse({ edited_description: null });
      expect(result.edited_description).toBeNull();
    });

    it("should convert empty string to null", () => {
      const result = updateEventSchema.parse({ edited_description: "" });
      expect(result.edited_description).toBeNull();
    });

    it("should convert whitespace-only string to null", () => {
      const result = updateEventSchema.parse({ edited_description: "   " });
      expect(result.edited_description).toBeNull();
    });

    it("should trim valid edited_description", () => {
      const result = updateEventSchema.parse({
        edited_description: "  Trimmed  ",
      });
      expect(result.edited_description).toBe("Trimmed");
    });

    it("should reject edited_description exceeding 500 characters", () => {
      const longDescription = "a".repeat(501);
      expect(() => updateEventSchema.parse({ edited_description: longDescription })).toThrow(
        "Opis nie może przekraczać 500 znaków"
      );
    });

    it("should accept edited_description with exactly 500 characters", () => {
      const exactDescription = "a".repeat(500);
      const result = updateEventSchema.parse({
        edited_description: exactDescription,
      });
      expect(result.edited_description).toBe(exactDescription);
    });
  });

  describe("at least one field requirement", () => {
    it("should accept when at least one field is provided", () => {
      expect(() => updateEventSchema.parse({ saved: true })).not.toThrow();
      expect(() => updateEventSchema.parse({ feedback: "thumbs_up" })).not.toThrow();
      expect(() => updateEventSchema.parse({ edited_description: "text" })).not.toThrow();
    });

    it("should accept when multiple fields are provided", () => {
      const result = updateEventSchema.parse({
        saved: true,
        feedback: "thumbs_up",
        edited_description: "New text",
      });
      expect(result.saved).toBe(true);
      expect(result.feedback).toBe("thumbs_up");
      expect(result.edited_description).toBe("New text");
    });

    it("should reject when no fields are provided", () => {
      expect(() => updateEventSchema.parse({})).toThrow("Należy podać co najmniej jedno pole do aktualizacji");
    });
  });
});

describe("getUserEventsQuerySchema", () => {
  describe("saved parameter", () => {
    it("should transform 'true' string to boolean true", () => {
      const result = getUserEventsQuerySchema.parse({ saved: "true" });
      expect(result.saved).toBe(true);
    });

    it("should transform 'false' string to boolean false", () => {
      const result = getUserEventsQuerySchema.parse({ saved: "false" });
      expect(result.saved).toBe(false);
    });

    it("should transform empty string to undefined", () => {
      const result = getUserEventsQuerySchema.parse({ saved: "" });
      expect(result.saved).toBeUndefined();
    });

    it("should transform invalid string to undefined", () => {
      const result = getUserEventsQuerySchema.parse({ saved: "invalid" });
      expect(result.saved).toBeUndefined();
    });

    it("should handle undefined saved parameter", () => {
      const result = getUserEventsQuerySchema.parse({});
      expect(result.saved).toBeUndefined();
    });
  });

  describe("category parameter", () => {
    it("should accept valid category", () => {
      const result = getUserEventsQuerySchema.parse({ category: "koncerty" });
      expect(result.category).toBe("koncerty");
    });

    it("should reject invalid category", () => {
      expect(() => getUserEventsQuerySchema.parse({ category: "invalid" })).toThrow(
        "Nieprawidłowa kategoria wydarzenia"
      );
    });

    it("should handle undefined category", () => {
      const result = getUserEventsQuerySchema.parse({});
      expect(result.category).toBeUndefined();
    });
  });

  describe("age_category parameter", () => {
    it("should accept valid age category", () => {
      const result = getUserEventsQuerySchema.parse({ age_category: "dorosli" });
      expect(result.age_category).toBe("dorosli");
    });

    it("should reject invalid age category", () => {
      expect(() => getUserEventsQuerySchema.parse({ age_category: "invalid" })).toThrow(
        "Nieprawidłowa kategoria wiekowa"
      );
    });

    it("should handle undefined age_category", () => {
      const result = getUserEventsQuerySchema.parse({});
      expect(result.age_category).toBeUndefined();
    });
  });

  describe("page parameter", () => {
    it("should transform valid page string to number", () => {
      const result = getUserEventsQuerySchema.parse({ page: "5" });
      expect(result.page).toBe(5);
    });

    it("should default to 1 when page is undefined", () => {
      const result = getUserEventsQuerySchema.parse({});
      expect(result.page).toBe(1);
    });

    it("should default to 1 when page is empty string", () => {
      const result = getUserEventsQuerySchema.parse({ page: "" });
      expect(result.page).toBe(1);
    });

    it("should default to 1 when page is not a number", () => {
      const result = getUserEventsQuerySchema.parse({ page: "invalid" });
      expect(result.page).toBe(1);
    });

    it("should default to 1 when page is less than 1", () => {
      const result = getUserEventsQuerySchema.parse({ page: "0" });
      expect(result.page).toBe(1);

      const result2 = getUserEventsQuerySchema.parse({ page: "-5" });
      expect(result2.page).toBe(1);
    });

    it("should accept page equal to 1", () => {
      const result = getUserEventsQuerySchema.parse({ page: "1" });
      expect(result.page).toBe(1);
    });
  });

  describe("limit parameter", () => {
    it("should transform valid limit string to number", () => {
      const result = getUserEventsQuerySchema.parse({ limit: "10" });
      expect(result.limit).toBe(10);
    });

    it("should default to 20 when limit is undefined", () => {
      const result = getUserEventsQuerySchema.parse({});
      expect(result.limit).toBe(20);
    });

    it("should default to 20 when limit is empty string", () => {
      const result = getUserEventsQuerySchema.parse({ limit: "" });
      expect(result.limit).toBe(20);
    });

    it("should default to 20 when limit is not a number", () => {
      const result = getUserEventsQuerySchema.parse({ limit: "invalid" });
      expect(result.limit).toBe(20);
    });

    it("should default to 20 when limit is less than 1", () => {
      const result = getUserEventsQuerySchema.parse({ limit: "0" });
      expect(result.limit).toBe(20);

      const result2 = getUserEventsQuerySchema.parse({ limit: "-5" });
      expect(result2.limit).toBe(20);
    });

    it("should cap limit at 100 when exceeding maximum", () => {
      const result = getUserEventsQuerySchema.parse({ limit: "101" });
      expect(result.limit).toBe(100);

      const result2 = getUserEventsQuerySchema.parse({ limit: "999" });
      expect(result2.limit).toBe(100);
    });

    it("should accept limit equal to 100", () => {
      const result = getUserEventsQuerySchema.parse({ limit: "100" });
      expect(result.limit).toBe(100);
    });

    it("should accept limit equal to 1", () => {
      const result = getUserEventsQuerySchema.parse({ limit: "1" });
      expect(result.limit).toBe(1);
    });
  });

  describe("sort parameter", () => {
    it("should accept valid sort fields", () => {
      const validSorts = ["created_at", "event_date", "title"];

      validSorts.forEach((sort) => {
        const result = getUserEventsQuerySchema.parse({ sort });
        expect(result.sort).toBe(sort);
      });
    });

    it("should default to 'created_at' when undefined", () => {
      const result = getUserEventsQuerySchema.parse({});
      expect(result.sort).toBe("created_at");
    });

    it("should reject invalid sort field", () => {
      expect(() => getUserEventsQuerySchema.parse({ sort: "invalid" })).toThrow("Nieprawidłowe pole sortowania");
    });
  });

  describe("order parameter", () => {
    it("should accept 'asc' order", () => {
      const result = getUserEventsQuerySchema.parse({ order: "asc" });
      expect(result.order).toBe("asc");
    });

    it("should accept 'desc' order", () => {
      const result = getUserEventsQuerySchema.parse({ order: "desc" });
      expect(result.order).toBe("desc");
    });

    it("should default to 'desc' when undefined", () => {
      const result = getUserEventsQuerySchema.parse({});
      expect(result.order).toBe("desc");
    });

    it("should reject invalid order value", () => {
      expect(() => getUserEventsQuerySchema.parse({ order: "invalid" })).toThrow("Nieprawidłowy kierunek sortowania");
    });
  });

  describe("complete query combinations", () => {
    it("should handle all parameters together", () => {
      const result = getUserEventsQuerySchema.parse({
        saved: "true",
        category: "koncerty",
        age_category: "dorosli",
        page: "2",
        limit: "50",
        sort: "event_date",
        order: "asc",
      });

      expect(result).toEqual({
        saved: true,
        category: "koncerty",
        age_category: "dorosli",
        page: 2,
        limit: 50,
        sort: "event_date",
        order: "asc",
      });
    });

    it("should apply defaults for missing parameters", () => {
      const result = getUserEventsQuerySchema.parse({
        category: "kino",
      });

      expect(result).toMatchInlineSnapshot(`
        {
          "category": "kino",
          "limit": 20,
          "order": "desc",
          "page": 1,
          "sort": "created_at",
        }
      `);
    });
  });
});

describe("getEventByIdParamsSchema", () => {
  it("should accept valid UUID", () => {
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";
    const result = getEventByIdParamsSchema.parse({ id: validUUID });
    expect(result.id).toBe(validUUID);
  });

  it("should reject invalid UUID format", () => {
    expect(() => getEventByIdParamsSchema.parse({ id: "invalid-uuid" })).toThrow("Nieprawidłowy format UUID");
  });

  it("should reject non-UUID strings", () => {
    expect(() => getEventByIdParamsSchema.parse({ id: "12345" })).toThrow("Nieprawidłowy format UUID");
    expect(() => getEventByIdParamsSchema.parse({ id: "not-a-uuid" })).toThrow("Nieprawidłowy format UUID");
  });

  it("should reject empty string", () => {
    expect(() => getEventByIdParamsSchema.parse({ id: "" })).toThrow("Nieprawidłowy format UUID");
  });

  it("should reject missing id field", () => {
    expect(() => getEventByIdParamsSchema.parse({})).toThrow();
  });
});
