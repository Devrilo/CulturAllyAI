import { describe, it, expect } from "vitest";
import { getAgeCategories, getEventCategories } from "../categories.service";
import type { AgeCategory, EventCategory } from "@/types";

describe("categories.service", () => {
  describe("getAgeCategories", () => {
    it("should return array of age categories", () => {
      const categories = getAgeCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(7);
    });

    it("should return all expected age category values", () => {
      const categories = getAgeCategories();
      const values = categories.map((c) => c.value);

      const expectedValues: AgeCategory[] = [
        "wszystkie",
        "najmlodsi",
        "dzieci",
        "nastolatkowie",
        "mlodzi_dorosli",
        "dorosli",
        "osoby_starsze",
      ];

      expectedValues.forEach((expected) => {
        expect(values).toContain(expected);
      });
    });

    it("should have Polish labels for all categories", () => {
      const categories = getAgeCategories();

      categories.forEach((category) => {
        expect(category.label).toBeDefined();
        expect(typeof category.label).toBe("string");
        expect(category.label.length).toBeGreaterThan(0);
      });
    });

    it("should return objects with value and label properties", () => {
      const categories = getAgeCategories();

      categories.forEach((category) => {
        expect(category).toHaveProperty("value");
        expect(category).toHaveProperty("label");
      });
    });

    it("should return consistent data on multiple calls", () => {
      const first = getAgeCategories();
      const second = getAgeCategories();

      expect(first).toEqual(second);
    });

    it("should include specific category mappings", () => {
      const categories = getAgeCategories();
      const categoryMap = Object.fromEntries(categories.map((c) => [c.value, c.label]));

      expect(categoryMap["wszystkie"]).toBe("Wszystkie");
      expect(categoryMap["najmlodsi"]).toBe("Najmłodsi (0-3 lata)");
      expect(categoryMap["dzieci"]).toBe("Dzieci (4-12 lat)");
      expect(categoryMap["nastolatkowie"]).toBe("Nastolatkowie (13-17 lat)");
      expect(categoryMap["mlodzi_dorosli"]).toBe("Młodzi dorośli (18-35 lat)");
      expect(categoryMap["dorosli"]).toBe("Dorośli (36-64 lata)");
      expect(categoryMap["osoby_starsze"]).toBe("Osoby starsze (65+ lat)");
    });
  });

  describe("getEventCategories", () => {
    it("should return array of event categories", () => {
      const categories = getEventCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(8);
    });

    it("should return all expected event category values", () => {
      const categories = getEventCategories();
      const values = categories.map((c) => c.value);

      const expectedValues: EventCategory[] = [
        "koncerty",
        "imprezy",
        "teatr_i_taniec",
        "sztuka_i_wystawy",
        "literatura",
        "kino",
        "festiwale",
        "inne",
      ];

      expectedValues.forEach((expected) => {
        expect(values).toContain(expected);
      });
    });

    it("should have Polish labels for all categories", () => {
      const categories = getEventCategories();

      categories.forEach((category) => {
        expect(category.label).toBeDefined();
        expect(typeof category.label).toBe("string");
        expect(category.label.length).toBeGreaterThan(0);
      });
    });

    it("should return objects with value and label properties", () => {
      const categories = getEventCategories();

      categories.forEach((category) => {
        expect(category).toHaveProperty("value");
        expect(category).toHaveProperty("label");
      });
    });

    it("should return consistent data on multiple calls", () => {
      const first = getEventCategories();
      const second = getEventCategories();

      expect(first).toEqual(second);
    });

    it("should include specific category mappings", () => {
      const categories = getEventCategories();
      const categoryMap = Object.fromEntries(categories.map((c) => [c.value, c.label]));

      expect(categoryMap["koncerty"]).toBe("Koncerty");
      expect(categoryMap["imprezy"]).toBe("Imprezy");
      expect(categoryMap["teatr_i_taniec"]).toBe("Teatr i taniec");
      expect(categoryMap["sztuka_i_wystawy"]).toBe("Sztuka i wystawy");
      expect(categoryMap["literatura"]).toBe("Literatura");
      expect(categoryMap["kino"]).toBe("Kino");
      expect(categoryMap["festiwale"]).toBe("Festiwale");
      expect(categoryMap["inne"]).toBe("Inne");
    });
  });
});
