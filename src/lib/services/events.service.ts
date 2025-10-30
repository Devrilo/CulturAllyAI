import type { TablesInsert, TablesUpdate } from "../../db/database.types";
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateEventDTO,
  EventResponseDTO,
  UpdateEventDTO,
  EventListItemDTO,
  EventsQueryDTO,
  PaginationDTO,
} from "../../types";
import { generateEventDescription } from "./ai/generate-event-description";

/**
 * Command for creating a new event
 */
export interface CreateEventCommand extends CreateEventDTO {
  userId: string | null;
  isAuthenticated: boolean;
  openRouterApiKey: string;
}

/**
 * Result of event creation
 */
export interface CreateEventResult {
  event: EventResponseDTO;
}

/**
 * Command for updating an existing event
 */
export interface UpdateEventCommand {
  eventId: string;
  userId: string;
  payload: UpdateEventDTO;
}

/**
 * Result of event update
 */
export interface UpdateEventResult {
  event: EventResponseDTO;
}

/**
 * Command for getting user events with filtering, sorting, and pagination
 */
export interface GetUserEventsCommand extends EventsQueryDTO {
  userId: string;
}

/**
 * Result of getting user events
 */
export interface GetUserEventsResult {
  data: EventListItemDTO[];
  pagination: PaginationDTO;
}

/**
 * Command for getting a single event by ID
 */
export interface GetEventByIdCommand {
  eventId: string;
  userId: string;
}

/**
 * Result of getting event by ID
 */
export interface GetEventByIdResult {
  event: EventResponseDTO;
}

/**
 * Command for soft deleting an event (sets saved = false)
 */
export interface SoftDeleteEventCommand {
  eventId: string;
  userId: string;
}

/**
 * Result of soft delete operation
 */
export interface SoftDeleteEventResult {
  eventId: string;
  message: string;
}

/**
 * Service error thrown when event operations fail
 */
export class EventServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "EventServiceError";
  }
}

/**
 * Creates a new event with AI-generated description
 *
 * @param supabase - Supabase client instance
 * @param command - Event creation command with user context
 * @returns Created event object
 * @throws EventServiceError if creation fails
 */
export async function createEvent(supabase: SupabaseClient, command: CreateEventCommand): Promise<CreateEventResult> {
  try {
    // Step 1: Generate AI description
    const { description, modelVersion } = await generateEventDescription(
      {
        title: command.title,
        city: command.city,
        event_date: command.event_date,
        category: command.category,
        age_category: command.age_category,
        key_information: command.key_information,
      },
      command.openRouterApiKey
    );

    // Validate generated description is not empty after trimming
    if (!description || description.trim().length === 0) {
      throw new EventServiceError("Wygenerowany opis jest pusty", 400, "EMPTY_DESCRIPTION");
    }

    // Step 2: Prepare event record for insertion
    const eventData = {
      title: command.title,
      city: command.city,
      event_date: command.event_date,
      category: command.category,
      age_category: command.age_category,
      key_information: command.key_information,
      generated_description: description,
      model_version: modelVersion,
      user_id: command.userId,
      created_by_authenticated_user: command.isAuthenticated,
      saved: false,
      feedback: null,
      edited_description: null,
    };

    // DEBUG: Log event data for RLS troubleshooting
    // eslint-disable-next-line no-console
    console.log("Attempting to insert event with data:", {
      user_id: eventData.user_id,
      created_by_authenticated_user: eventData.created_by_authenticated_user,
      saved: eventData.saved,
      feedback: eventData.feedback,
      edited_description: eventData.edited_description,
      isAuthenticated: command.isAuthenticated,
    });

    // Step 3: Insert event into database
    // For guests, we can't use .select() because RLS blocks SELECT for anon role
    // So we insert without .select() and construct the response from input data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any; // Using any here because guest events have temp UUID vs DB-generated id

    if (command.isAuthenticated) {
      // Authenticated users can use .select() to get the inserted row
      const { data, error: insertError } = await supabase.from("events").insert(eventData).select().single();

      if (insertError) {
        // eslint-disable-next-line no-console
        console.error("Failed to insert event:", insertError);
        throw new EventServiceError("Nie udało się utworzyć wydarzenia", 500, "INSERT_FAILED");
      }

      if (!data) {
        throw new EventServiceError("Nie udało się pobrać utworzonego wydarzenia", 500, "EVENT_NOT_RETURNED");
      }

      event = data;
    } else {
      // Guests: INSERT without .select() to avoid RLS blocking SELECT
      const { error: insertError } = await supabase.from("events").insert(eventData);

      if (insertError) {
        // eslint-disable-next-line no-console
        console.error("Failed to insert event:", insertError);
        throw new EventServiceError("Nie udało się utworzyć wydarzenia", 500, "INSERT_FAILED");
      }

      // For guests, construct the response from input data + generated fields
      // Note: We can't get the real DB-generated id, so we use a temp UUID
      event = {
        ...eventData,
        id: crypto.randomUUID(), // Temporary ID for display (not the real DB id)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    if (!event) {
      throw new EventServiceError("Nie udało się pobrać utworzonego wydarzenia", 500, "EVENT_NOT_RETURNED");
    }

    // Step 4: Log event creation in event_management_logs
    // Skip logging for guest events since their temp UUID doesn't exist in DB
    if (command.isAuthenticated) {
      const logData = {
        action_type: "event_created" as const,
        event_id: event.id,
        user_id: command.userId,
      };

      const { error: logError } = await supabase.from("event_management_logs").insert(logData);

      if (logError) {
        // Log error but don't fail the operation
        // eslint-disable-next-line no-console
        console.error("Failed to log event creation:", logError);
      }
    }

    // Step 5: Return created event
    return {
      event,
    };
  } catch (error) {
    // Re-throw EventServiceError and AIGenerationError as-is
    if (error instanceof EventServiceError) {
      throw error;
    }

    // Handle other errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in createEvent:", error);
    throw new EventServiceError("Wystąpił nieoczekiwany błąd podczas tworzenia wydarzenia", 500, "UNEXPECTED_ERROR");
  }
}

/**
 * Updates selected fields of an event owned by the authenticated user
 * Applies business rules and logs audit events
 */
export async function updateEvent(supabase: SupabaseClient, command: UpdateEventCommand): Promise<UpdateEventResult> {
  try {
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", command.eventId)
      .eq("user_id", command.userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new EventServiceError("Wydarzenie nie zostało znalezione", 404, "EVENT_NOT_FOUND");
      }

      // eslint-disable-next-line no-console
      console.error("Failed to fetch event for update:", fetchError);
      throw new EventServiceError("Nie udało się pobrać wydarzenia do aktualizacji", 500, "EVENT_FETCH_FAILED");
    }

    if (!existingEvent) {
      throw new EventServiceError("Wydarzenie nie zostało znalezione", 404, "EVENT_NOT_FOUND");
    }

    if (!existingEvent.created_by_authenticated_user) {
      throw new EventServiceError(
        "Aktualizacja wydarzeń utworzonych przez gości jest zabroniona",
        403,
        "GUEST_EVENT_UPDATE_FORBIDDEN"
      );
    }

    const updates: TablesUpdate<"events"> = {};
    const { saved, feedback, edited_description } = command.payload;

    if (saved !== undefined && saved !== existingEvent.saved) {
      updates.saved = saved;
    }

    if (feedback !== undefined && feedback !== existingEvent.feedback) {
      updates.feedback = feedback;
    }

    if (edited_description !== undefined && edited_description !== existingEvent.edited_description) {
      updates.edited_description = edited_description;
    }

    if (Object.keys(updates).length === 0) {
      throw new EventServiceError("Brak zmian do wprowadzenia", 400, "NO_FIELDS_TO_UPDATE");
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update(updates)
      .eq("id", command.eventId)
      .select()
      .single();

    if (updateError || !updatedEvent) {
      if (updateError) {
        // eslint-disable-next-line no-console
        console.error("Failed to update event:", updateError);
      }

      throw new EventServiceError("Nie udało się zaktualizować wydarzenia", 500, "UPDATE_FAILED");
    }

    const logEntries: TablesInsert<"event_management_logs">[] = [];

    if (Object.prototype.hasOwnProperty.call(updates, "saved")) {
      logEntries.push({
        action_type: "event_saved",
        event_id: command.eventId,
        user_id: command.userId,
      });
    }

    if (Object.prototype.hasOwnProperty.call(updates, "feedback")) {
      logEntries.push({
        action_type: "event_rated",
        event_id: command.eventId,
        user_id: command.userId,
      });
    }

    if (Object.prototype.hasOwnProperty.call(updates, "edited_description")) {
      logEntries.push({
        action_type: "event_edited",
        event_id: command.eventId,
        user_id: command.userId,
      });
    }

    if (logEntries.length > 0) {
      const { error: logError } = await supabase.from("event_management_logs").insert(logEntries);

      if (logError) {
        // eslint-disable-next-line no-console
        console.error("Failed to log event update:", logError);
      }
    }

    return { event: updatedEvent };
  } catch (error) {
    if (error instanceof EventServiceError) {
      throw error;
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error in updateEvent:", error);
    throw new EventServiceError("Wystąpił nieoczekiwany błąd podczas aktualizacji wydarzenia", 500, "UNEXPECTED_ERROR");
  }
}

/**
 * Retrieves a paginated list of events for the authenticated user
 * Supports filtering by saved status, category, and age_category
 * Supports sorting by created_at, event_date, or title
 *
 * @param supabase - Supabase client instance
 * @param command - Query command with filters, pagination, and sorting
 * @returns Paginated list of events with metadata
 * @throws EventServiceError if query fails
 */
export async function getUserEvents(
  supabase: SupabaseClient,
  command: GetUserEventsCommand
): Promise<GetUserEventsResult> {
  try {
    const {
      userId,
      saved,
      category,
      age_category,
      page = 1,
      limit = 20,
      sort = "created_at",
      order = "desc",
    } = command;

    // Build base query with user_id filter (double security with RLS)
    let countQuery = supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", userId);

    let dataQuery = supabase.from("events").select("*").eq("user_id", userId);

    // Apply optional filters
    if (saved !== undefined) {
      countQuery = countQuery.eq("saved", saved);
      dataQuery = dataQuery.eq("saved", saved);
    }

    if (category !== undefined) {
      countQuery = countQuery.eq("category", category);
      dataQuery = dataQuery.eq("category", category);
    }

    if (age_category !== undefined) {
      countQuery = countQuery.eq("age_category", age_category);
      dataQuery = dataQuery.eq("age_category", age_category);
    }

    // Apply sorting
    dataQuery = dataQuery.order(sort, { ascending: order === "asc" });

    // Apply pagination
    const offset = (page - 1) * limit;
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Execute count and data queries in parallel for performance
    const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

    // Handle count query errors
    if (countResult.error) {
      // eslint-disable-next-line no-console
      console.error("Failed to count user events:", countResult.error);
      throw new EventServiceError("Nie udało się pobrać liczby wydarzeń", 500, "COUNT_FAILED");
    }

    // Handle data query errors
    if (dataResult.error) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch user events:", dataResult.error);
      throw new EventServiceError("Nie udało się pobrać wydarzeń", 500, "QUERY_FAILED");
    }

    const total = countResult.count || 0;
    const events = dataResult.data || [];

    // Map to EventListItemDTO (omit model_version)
    const eventListItems: EventListItemDTO[] = events.map((event) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { model_version, ...eventWithoutModelVersion } = event;
      return eventWithoutModelVersion;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination: PaginationDTO = {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_next: hasNext,
      has_prev: hasPrev,
    };

    return {
      data: eventListItems,
      pagination,
    };
  } catch (error) {
    // Re-throw EventServiceError as-is
    if (error instanceof EventServiceError) {
      throw error;
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in getUserEvents:", error);
    throw new EventServiceError("Wystąpił nieoczekiwany błąd podczas pobierania wydarzeń", 500, "UNEXPECTED_ERROR");
  }
}

/**
 * Retrieves a single event by ID for the authenticated user
 * Uses RLS and explicit user_id filter for security
 *
 * @param supabase - Supabase client instance
 * @param command - Command with event ID and user ID
 * @returns Event object
 * @throws EventServiceError if event not found or fetch fails
 */
export async function getEventById(
  supabase: SupabaseClient,
  command: GetEventByIdCommand
): Promise<GetEventByIdResult> {
  try {
    const { eventId, userId } = command;

    // Query event with double security: RLS + explicit user_id filter
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("user_id", userId)
      .single();

    // Handle fetch errors
    if (fetchError) {
      // PGRST116 = no rows returned
      if (fetchError.code === "PGRST116") {
        throw new EventServiceError("Wydarzenie nie zostało znalezione", 404, "EVENT_NOT_FOUND");
      }

      // Other database errors
      // eslint-disable-next-line no-console
      console.error("Failed to fetch event by ID:", fetchError);
      throw new EventServiceError("Nie udało się pobrać wydarzenia", 500, "EVENT_FETCH_FAILED");
    }

    // Validate event exists (defensive check)
    if (!event) {
      throw new EventServiceError("Wydarzenie nie zostało znalezione", 404, "EVENT_NOT_FOUND");
    }

    return { event };
  } catch (error) {
    // Re-throw EventServiceError as-is
    if (error instanceof EventServiceError) {
      throw error;
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in getEventById:", error);
    throw new EventServiceError("Wystąpił nieoczekiwany błąd podczas pobierania wydarzenia", 500, "UNEXPECTED_ERROR");
  }
}

/**
 * Performs soft delete on an event by setting saved = false
 * Only allows soft deletion of events owned by authenticated users
 * Logs the action in event_management_logs
 *
 * @param supabase - Supabase client instance
 * @param command - Command with event ID and user ID
 * @returns Result with event ID and confirmation message
 * @throws EventServiceError if soft delete fails or event doesn't exist
 */
export async function softDeleteEvent(
  supabase: SupabaseClient,
  command: SoftDeleteEventCommand
): Promise<SoftDeleteEventResult> {
  try {
    const { eventId, userId } = command;

    // Step 1: Perform soft delete (set saved = false) with double security: RLS + explicit user_id filter
    const { data: deletedEvent, error: updateError } = await supabase
      .from("events")
      .update({ saved: false })
      .eq("id", eventId)
      .eq("user_id", userId)
      .select()
      .single();

    // Handle update errors
    if (updateError) {
      // PGRST116 = no rows returned (event not found or not owned by user)
      if (updateError.code === "PGRST116") {
        throw new EventServiceError("Wydarzenie nie zostało znalezione", 404, "EVENT_NOT_FOUND");
      }

      // Other database errors
      // eslint-disable-next-line no-console
      console.error("Failed to soft delete event:", updateError);
      throw new EventServiceError("Nie udało się usunąć wydarzenia", 500, "EVENT_SOFT_DELETE_FAILED");
    }

    // Validate event exists (defensive check)
    if (!deletedEvent) {
      throw new EventServiceError("Wydarzenie nie zostało znalezione", 404, "EVENT_NOT_FOUND");
    }

    // Step 2: Validate that event was created by authenticated user (403 if guest event)
    if (!deletedEvent.created_by_authenticated_user) {
      throw new EventServiceError(
        "Usuwanie wydarzeń utworzonych przez gości jest zabronione",
        403,
        "GUEST_EVENT_MODIFICATION"
      );
    }

    // Step 3: Log deletion in event_management_logs
    const logData = {
      action_type: "event_deleted" as const,
      event_id: eventId,
      user_id: userId,
    };

    const { error: logError } = await supabase.from("event_management_logs").insert(logData);

    if (logError) {
      // Log error but don't fail the operation
      // eslint-disable-next-line no-console
      console.error("Failed to log event soft deletion:", logError);
    }

    // Step 4: Return success result
    return {
      eventId,
      message: "Event removed from saved list",
    };
  } catch (error) {
    // Re-throw EventServiceError as-is
    if (error instanceof EventServiceError) {
      throw error;
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in softDeleteEvent:", error);
    throw new EventServiceError("Wystąpił nieoczekiwany błąd podczas usuwania wydarzenia", 500, "UNEXPECTED_ERROR");
  }
}
