import type { EventListItemDTO, SavedEventViewModel, EventCategoryDTO, AgeCategoryDTO } from "@/types";

/**
 * Maps EventListItemDTO to SavedEventViewModel with UI-friendly labels
 */
export function mapEventToViewModel(
  event: EventListItemDTO,
  categories: EventCategoryDTO[],
  ageCategories: AgeCategoryDTO[]
): SavedEventViewModel {
  const description = event.edited_description || event.generated_description;

  return {
    id: event.id,
    title: event.title,
    city: event.city,
    eventDateISO: event.event_date,
    eventDateLabel: new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(event.event_date)),
    category: event.category,
    categoryLabel: categories.find((c) => c.value === event.category)?.label ?? event.category,
    ageCategory: event.age_category,
    ageCategoryLabel: ageCategories.find((c) => c.value === event.age_category)?.label ?? event.age_category,
    keyInformation: event.key_information,
    description,
    editedDescription: event.edited_description,
    feedback: event.feedback,
    saved: event.saved,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
    isGuestOwned: !event.user_id,
    charCount: description.length,
  };
}
