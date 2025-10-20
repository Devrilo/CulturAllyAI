import type { AgeCategoryDTO, AgeCategory, EventCategoryDTO, EventCategory } from "../../types";

/**
 * Maps age category enum values to Polish labels
 */
const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  wszystkie: "Wszystkie",
  najmlodsi: "Najmłodsi (0-3 lata)",
  dzieci: "Dzieci (4-12 lat)",
  nastolatkowie: "Nastolatkowie (13-17 lat)",
  mlodzi_dorosli: "Młodzi dorośli (18-35 lat)",
  dorosli: "Dorośli (36-64 lata)",
  osoby_starsze: "Osoby starsze (65+ lat)",
};

/**
 * Returns the complete list of age categories with Polish labels
 * This function returns static data and does not require database access
 *
 * @returns Array of age category DTOs with value and label
 */
export function getAgeCategories(): AgeCategoryDTO[] {
  return Object.entries(AGE_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as AgeCategory,
    label,
  }));
}

/**
 * Maps event category enum values to Polish labels
 */
const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  koncerty: "Koncerty",
  imprezy: "Imprezy",
  teatr_i_taniec: "Teatr i taniec",
  sztuka_i_wystawy: "Sztuka i wystawy",
  literatura: "Literatura",
  kino: "Kino",
  festiwale: "Festiwale",
  inne: "Inne",
};

/**
 * Returns the complete list of event categories with Polish labels
 * This function returns static data and does not require database access
 *
 * @returns Array of event category DTOs with value and label
 */
export function getEventCategories(): EventCategoryDTO[] {
  return Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as EventCategory,
    label,
  }));
}
