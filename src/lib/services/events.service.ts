import type { TablesInsert, TablesUpdate } from "../../db/database.types";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateEventDTO, EventResponseDTO, UpdateEventDTO } from "../../types";
import { generateEventDescription } from "./ai/generate-event-description";

/**
 * Command for creating a new event
 */
export interface CreateEventCommand extends CreateEventDTO {
  userId: string | null;
  isAuthenticated: boolean;
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
    const { description, modelVersion } = await generateEventDescription({
      title: command.title,
      city: command.city,
      event_date: command.event_date,
      category: command.category,
      age_category: command.age_category,
      key_information: command.key_information,
    });

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

    // Step 3: Insert event into database
    const { data: event, error: insertError } = await supabase.from("events").insert(eventData).select().single();

    if (insertError) {
      // eslint-disable-next-line no-console
      console.error("Failed to insert event:", insertError);
      throw new EventServiceError("Nie udało się utworzyć wydarzenia", 500, "INSERT_FAILED");
    }

    if (!event) {
      throw new EventServiceError("Nie udało się pobrać utworzonego wydarzenia", 500, "EVENT_NOT_RETURNED");
    }

    // Step 4: Log event creation in event_management_logs
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

    if (
      Object.prototype.hasOwnProperty.call(updates, "feedback") ||
      Object.prototype.hasOwnProperty.call(updates, "edited_description")
    ) {
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
