import type {
  EventResponseDTO,
  GeneratedEventViewModel,
  CategoriesQueryData,
  AgeCategoriesQueryData,
} from "../../types";

/**
 * Map EventResponseDTO to GeneratedEventViewModel with UI-friendly labels
 */
export function mapEventResponse(
  event: EventResponseDTO,
  categories: CategoriesQueryData,
  ageCategories: AgeCategoriesQueryData
): GeneratedEventViewModel {
  const categoryLabel = categories.find((c) => c.value === event.category)?.label || event.category;
  const ageCategoryLabel = ageCategories.find((c) => c.value === event.age_category)?.label || event.age_category;

  return {
    id: event.id,
    title: event.title,
    city: event.city,
    event_date: event.event_date,
    categoryLabel,
    ageCategoryLabel,
    key_information: event.key_information,
    description: event.edited_description || event.generated_description,
    saved: event.saved,
    feedback: event.feedback,
    createdByAuthenticated: event.created_by_authenticated_user,
    updatedAt: event.updated_at,
  };
}
