import type {
  EventsQueryDTO,
  EventsListResponseDTO,
  UpdateEventDTO,
  EventResponseDTO,
  MessageResponseDTO,
  EventCategoriesResponseDTO,
  AgeCategoriesResponseDTO,
} from "@/types";

/**
 * Fetches paginated list of events with filters
 * @param params Query parameters including filters and pagination
 * @returns Promise with events list and pagination data
 * @throws Error with status code if request fails
 */
export async function fetchEvents(params: EventsQueryDTO): Promise<EventsListResponseDTO> {
  const query = new URLSearchParams();

  // Add all defined params to query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const res = await fetch(`/api/events?${query.toString()}`);

  if (!res.ok) {
    throw new Error(`${res.status}`);
  }

  return res.json();
}

/**
 * Updates an event (edit description, save, rate)
 * @param id Event ID
 * @param data Update payload
 * @returns Promise with updated event
 * @throws Error with status code if request fails
 */
export async function updateEvent(id: string, data: UpdateEventDTO): Promise<EventResponseDTO> {
  const res = await fetch(`/api/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`${res.status}`);
  }

  return res.json();
}

/**
 * Soft deletes an event
 * @param id Event ID
 * @returns Promise with success message
 * @throws Error with status code if request fails
 */
export async function deleteEvent(id: string): Promise<MessageResponseDTO> {
  const res = await fetch(`/api/events/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`${res.status}`);
  }

  return res.json();
}

/**
 * Fetches event categories
 * @returns Promise with categories list
 * @throws Error with status code if request fails
 */
export async function fetchEventCategories(): Promise<EventCategoriesResponseDTO> {
  const res = await fetch("/api/categories/events");

  if (!res.ok) {
    throw new Error(`${res.status}`);
  }

  return res.json();
}

/**
 * Fetches age categories
 * @returns Promise with age categories list
 * @throws Error with status code if request fails
 */
export async function fetchAgeCategories(): Promise<AgeCategoriesResponseDTO> {
  const res = await fetch("/api/categories/age");

  if (!res.ok) {
    throw new Error(`${res.status}`);
  }

  return res.json();
}
