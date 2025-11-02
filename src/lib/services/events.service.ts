/**
 * @fileoverview Events Service Module
 * 
 * This module provides comprehensive business logic for managing cultural events in the CulturAllyAI application.
 * It implements a Command-Result pattern for all event operations, ensuring type safety and clear interfaces.
 * 
 * @module services/events
 * 
 * Key Features:
 * - Event creation with AI-generated descriptions
 * - Event updates with audit logging
 * - Paginated event retrieval with filtering and sorting
 * - Soft delete functionality
 * - Support for both authenticated users and guest users
 * - Row-Level Security (RLS) integration with Supabase
 * - Comprehensive error handling with custom error types
 * 
 * Dependencies:
 * - Supabase: Database client for data persistence and RLS
 * - AI Service: Generates event descriptions using OpenRouter API
 * - Database Types: Auto-generated types from Supabase schema
 * 
 * Security Considerations:
 * - All operations validate user ownership through RLS and explicit filters
 * - Guest users have limited capabilities (cannot update or delete)
 * - All mutations are logged in event_management_logs for audit trail
 * 
 * @author CulturAllyAI Team
 * @since 1.0.0
 */

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
 * Command interface for creating a new event.
 * 
 * Extends CreateEventDTO with additional context about the user and authentication state.
 * This command is processed by the createEvent function to generate and persist a new event.
 * 
 * @interface CreateEventCommand
 * @extends {CreateEventDTO}
 * 
 * @property {string | null} userId - User ID if authenticated, null for guest users
 * @property {boolean} isAuthenticated - Whether the user is authenticated (affects RLS behavior)
 * @property {string} openRouterApiKey - API key for OpenRouter AI service (required for description generation)
 * 
 * @example
 * ```typescript
 * const command: CreateEventCommand = {
 *   title: "Koncert jazzowy",
 *   city: "Warszawa",
 *   event_date: "2025-12-01",
 *   category: "muzyka",
 *   age_category: "dorośli",
 *   key_information: "Występ znanego zespołu",
 *   userId: "123e4567-e89b-12d3-a456-426614174000",
 *   isAuthenticated: true,
 *   openRouterApiKey: "sk-or-..."
 * };
 * ```
 */
export interface CreateEventCommand extends CreateEventDTO {
  userId: string | null;
  isAuthenticated: boolean;
  openRouterApiKey: string;
}

/**
 * Result interface for event creation operations.
 * 
 * Contains the newly created event with all generated fields populated.
 * 
 * @interface CreateEventResult
 * 
 * @property {EventResponseDTO} event - The created event object with AI-generated description
 */
export interface CreateEventResult {
  event: EventResponseDTO;
}

/**
 * Command interface for updating an existing event.
 * 
 * Allows partial updates to event fields (saved, feedback, edited_description).
 * Only the event owner can perform updates, enforced by RLS and explicit validation.
 * 
 * @interface UpdateEventCommand
 * 
 * @property {string} eventId - UUID of the event to update
 * @property {string} userId - UUID of the user performing the update (must match event owner)
 * @property {UpdateEventDTO} payload - Partial update payload with fields to modify
 * 
 * @example
 * ```typescript
 * const command: UpdateEventCommand = {
 *   eventId: "event-uuid",
 *   userId: "user-uuid",
 *   payload: {
 *     saved: true,
 *     feedback: "positive"
 *   }
 * };
 * ```
 */
export interface UpdateEventCommand {
  eventId: string;
  userId: string;
  payload: UpdateEventDTO;
}

/**
 * Result interface for event update operations.
 * 
 * @interface UpdateEventResult
 * 
 * @property {EventResponseDTO} event - The updated event object with modified fields
 */
export interface UpdateEventResult {
  event: EventResponseDTO;
}

/**
 * Command interface for retrieving user events with advanced filtering and pagination.
 * 
 * Extends EventsQueryDTO with userId for security context.
 * Supports filtering by category, age category, and saved status.
 * Supports sorting by created_at, event_date, or title.
 * 
 * @interface GetUserEventsCommand
 * @extends {EventsQueryDTO}
 * 
 * @property {string} userId - UUID of the user whose events to retrieve
 * @property {boolean} [saved] - Optional filter for saved status
 * @property {string} [category] - Optional filter for event category
 * @property {string} [age_category] - Optional filter for age category
 * @property {number} [page=1] - Page number for pagination (1-indexed)
 * @property {number} [limit=20] - Number of items per page
 * @property {"created_at" | "event_date" | "title"} [sort="created_at"] - Field to sort by
 * @property {"asc" | "desc"} [order="desc"] - Sort order
 * 
 * @example
 * ```typescript
 * const command: GetUserEventsCommand = {
 *   userId: "user-uuid",
 *   saved: true,
 *   category: "muzyka",
 *   page: 1,
 *   limit: 10,
 *   sort: "event_date",
 *   order: "asc"
 * };
 * ```
 */
export interface GetUserEventsCommand extends EventsQueryDTO {
  userId: string;
}

/**
 * Result interface for paginated user events retrieval.
 * 
 * Contains both the event data and pagination metadata for client-side rendering.
 * 
 * @interface GetUserEventsResult
 * 
 * @property {EventListItemDTO[]} data - Array of events for the current page (excludes model_version)
 * @property {PaginationDTO} pagination - Pagination metadata including total count and navigation info
 */
export interface GetUserEventsResult {
  data: EventListItemDTO[];
  pagination: PaginationDTO;
}

/**
 * Command interface for retrieving a single event by ID.
 * 
 * Validates that the user owns the event before returning it.
 * 
 * @interface GetEventByIdCommand
 * 
 * @property {string} eventId - UUID of the event to retrieve
 * @property {string} userId - UUID of the user requesting the event (must match owner)
 * 
 * @example
 * ```typescript
 * const command: GetEventByIdCommand = {
 *   eventId: "event-uuid",
 *   userId: "user-uuid"
 * };
 * ```
 */
export interface GetEventByIdCommand {
  eventId: string;
  userId: string;
}

/**
 * Result interface for single event retrieval.
 * 
 * @interface GetEventByIdResult
 * 
 * @property {EventResponseDTO} event - The requested event object with all fields
 */
export interface GetEventByIdResult {
  event: EventResponseDTO;
}

/**
 * Command interface for soft deleting an event.
 * 
 * Soft delete sets the 'saved' flag to false rather than removing the record.
 * Only events created by authenticated users can be soft deleted.
 * Guest-created events cannot be modified.
 * 
 * @interface SoftDeleteEventCommand
 * 
 * @property {string} eventId - UUID of the event to soft delete
 * @property {string} userId - UUID of the user performing the deletion (must match owner)
 * 
 * @example
 * ```typescript
 * const command: SoftDeleteEventCommand = {
 *   eventId: "event-uuid",
 *   userId: "user-uuid"
 * };
 * ```
 */
export interface SoftDeleteEventCommand {
  eventId: string;
  userId: string;
}

/**
 * Result interface for soft delete operations.
 * 
 * @interface SoftDeleteEventResult
 * 
 * @property {string} eventId - UUID of the soft deleted event
 * @property {string} message - Confirmation message describing the action taken
 */
export interface SoftDeleteEventResult {
  eventId: string;
  message: string;
}

/**
 * Custom error class for event service operations.
 * 
 * Extends the standard Error class with additional context useful for API responses:
 * - HTTP status code for proper REST API error handling
 * - Error code for client-side error categorization and i18n
 * 
 * Common error codes:
 * - EMPTY_DESCRIPTION: AI generated empty description
 * - INSERT_FAILED: Database insertion failed
 * - EVENT_NOT_FOUND: Event doesn't exist or user doesn't have access
 * - GUEST_EVENT_UPDATE_FORBIDDEN: Attempt to modify guest-created event
 * - NO_FIELDS_TO_UPDATE: Update payload is empty or unchanged
 * - UPDATE_FAILED: Database update failed
 * - COUNT_FAILED: Failed to count events
 * - QUERY_FAILED: Failed to query events
 * - EVENT_FETCH_FAILED: Failed to fetch single event
 * - UNEXPECTED_ERROR: Unhandled error occurred
 * 
 * @class EventServiceError
 * @extends {Error}
 * 
 * @property {string} name - Always "EventServiceError"
 * @property {number} statusCode - HTTP status code (400, 403, 404, 500, etc.)
 * @property {string} [code] - Optional machine-readable error code
 * 
 * @example
 * ```typescript
 * throw new EventServiceError(
 *   "Wydarzenie nie zostało znalezione",
 *   404,
 *   "EVENT_NOT_FOUND"
 * );
 * ```
 */
export class EventServiceError extends Error {
  /**
   * Creates a new EventServiceError.
   * 
   * @param {string} message - Human-readable error message (typically in Polish for end users)
   * @param {number} statusCode - HTTP status code appropriate for the error type
   * @param {string} [code] - Optional machine-readable error code for client-side handling
   */
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
 * Creates a new event with AI-generated description.
 * 
 * This function orchestrates the complete event creation workflow:
 * 1. Generates an AI description using OpenRouter API
 * 2. Validates the generated description is not empty
 * 3. Inserts the event into the database with appropriate RLS handling
 * 4. Logs the creation action for authenticated users
 * 5. Returns the created event object
 * 
 * Special Handling for Guest Users:
 * - Guest users can create events but cannot retrieve them later (RLS blocks SELECT)
 * - For guests, a temporary UUID is generated for the response (not the real DB ID)
 * - Guest events are not logged in event_management_logs
 * 
 * Business Rules:
 * - All events are initially created with saved=false
 * - AI-generated description must not be empty after trimming
 * - Guest events have created_by_authenticated_user=false
 * 
 * @async
 * @function createEvent
 * 
 * @param {SupabaseClient} supabase - Supabase client instance with appropriate user context (auth or anon)
 * @param {CreateEventCommand} command - Event creation command containing:
 *   - title: Event title
 *   - city: Event location
 *   - event_date: Event date in ISO format
 *   - category: Event category (e.g., "muzyka", "teatr")
 *   - age_category: Target age group (e.g., "dzieci", "dorośli")
 *   - key_information: Additional event details for AI context
 *   - userId: User ID (null for guests)
 *   - isAuthenticated: Authentication status
 *   - openRouterApiKey: API key for AI generation
 * 
 * @returns {Promise<CreateEventResult>} Promise resolving to an object containing the created event
 * 
 * @throws {EventServiceError} With statusCode 400 and code "EMPTY_DESCRIPTION" if AI generates empty description
 * @throws {EventServiceError} With statusCode 500 and code "INSERT_FAILED" if database insertion fails
 * @throws {EventServiceError} With statusCode 500 and code "EVENT_NOT_RETURNED" if event retrieval fails (authenticated users)
 * @throws {EventServiceError} With statusCode 500 and code "UNEXPECTED_ERROR" for unhandled errors
 * 
 * @example
 * ```typescript
 * // Authenticated user creating an event
 * const result = await createEvent(supabase, {
 *   title: "Festiwal Jazzowy",
 *   city: "Kraków",
 *   event_date: "2025-08-15",
 *   category: "muzyka",
 *   age_category: "wszyscy",
 *   key_information: "Trzydniowy festiwal z międzynarodowymi artystami",
 *   userId: "user-uuid",
 *   isAuthenticated: true,
 *   openRouterApiKey: "sk-or-..."
 * });
 * console.log(result.event.generated_description);
 * ```
 * 
 * @example
 * ```typescript
 * // Guest user creating an event
 * const result = await createEvent(supabaseAnon, {
 *   title: "Warsztaty plastyczne",
 *   city: "Warszawa",
 *   event_date: "2025-09-10",
 *   category: "warsztat",
 *   age_category: "dzieci",
 *   key_information: "Dla dzieci w wieku 6-12 lat",
 *   userId: null,
 *   isAuthenticated: false,
 *   openRouterApiKey: "sk-or-..."
 * });
 * // Note: result.event.id is a temporary UUID, not the real DB ID
 * ```
 * 
 * @see {@link generateEventDescription} for AI description generation
 * @see {@link CreateEventCommand} for command interface details
 * @see {@link CreateEventResult} for result interface details
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
 * Updates selected fields of an existing event.
 * 
 * This function implements partial update functionality with the following workflow:
 * 1. Fetches the existing event and validates ownership
 * 2. Validates that the event was created by an authenticated user
 * 3. Builds an update payload with only changed fields
 * 4. Applies the updates to the database
 * 5. Logs appropriate actions in event_management_logs
 * 
 * Business Rules:
 * - Only events created by authenticated users can be updated
 * - Guest-created events cannot be modified (403 error)
 * - Only the event owner can perform updates (validated via RLS + explicit user_id check)
 * - At least one field must be changed (400 error if no changes)
 * - Each field update generates a corresponding audit log entry
 * 
 * Supported Update Fields:
 * - saved: Boolean flag indicating if event is saved to user's collection
 * - feedback: User feedback ("positive", "negative", or null)
 * - edited_description: User-edited version of the generated description
 * 
 * Audit Logging:
 * - saved=true → "event_saved" log entry
 * - feedback changed → "event_rated" log entry
 * - edited_description changed → "event_edited" log entry
 * 
 * @async
 * @function updateEvent
 * 
 * @param {SupabaseClient} supabase - Supabase client instance with authenticated user context
 * @param {UpdateEventCommand} command - Update command containing:
 *   - eventId: UUID of the event to update
 *   - userId: UUID of the user performing the update
 *   - payload: Object with fields to update (saved, feedback, edited_description)
 * 
 * @returns {Promise<UpdateEventResult>} Promise resolving to an object containing the updated event
 * 
 * @throws {EventServiceError} With statusCode 404 and code "EVENT_NOT_FOUND" if event doesn't exist or user lacks access
 * @throws {EventServiceError} With statusCode 403 and code "GUEST_EVENT_UPDATE_FORBIDDEN" if attempting to update guest-created event
 * @throws {EventServiceError} With statusCode 400 and code "NO_FIELDS_TO_UPDATE" if no fields are changed
 * @throws {EventServiceError} With statusCode 500 and code "EVENT_FETCH_FAILED" if initial event fetch fails
 * @throws {EventServiceError} With statusCode 500 and code "UPDATE_FAILED" if database update fails
 * @throws {EventServiceError} With statusCode 500 and code "UNEXPECTED_ERROR" for unhandled errors
 * 
 * @example
 * ```typescript
 * // Save an event to user's collection
 * const result = await updateEvent(supabase, {
 *   eventId: "event-uuid",
 *   userId: "user-uuid",
 *   payload: { saved: true }
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Update feedback and edited description
 * const result = await updateEvent(supabase, {
 *   eventId: "event-uuid",
 *   userId: "user-uuid",
 *   payload: {
 *     feedback: "positive",
 *     edited_description: "Zaktualizowany opis wydarzenia"
 *   }
 * });
 * // Generates two audit log entries: "event_rated" and "event_edited"
 * ```
 * 
 * @see {@link UpdateEventCommand} for command interface details
 * @see {@link UpdateEventResult} for result interface details
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
 * Retrieves a paginated list of events for the authenticated user.
 * 
 * This function provides advanced event querying capabilities with:
 * - Flexible filtering by multiple criteria
 * - Customizable sorting
 * - Efficient pagination
 * - Complete pagination metadata for UI rendering
 * 
 * The function executes count and data queries in parallel for optimal performance.
 * All queries are protected by Row-Level Security (RLS) and explicit user_id filtering.
 * 
 * Filtering Options:
 * - saved: Filter by saved status (true/false)
 * - category: Filter by event category (e.g., "muzyka", "teatr", "film")
 * - age_category: Filter by age category (e.g., "dzieci", "młodzież", "dorośli")
 * 
 * Sorting Options:
 * - sort: Field to sort by ("created_at", "event_date", "title")
 * - order: Sort direction ("asc" or "desc")
 * 
 * Pagination:
 * - page: Current page number (1-indexed)
 * - limit: Number of items per page
 * - Returns total count, total pages, and navigation flags
 * 
 * Security:
 * - Double security: RLS policies + explicit user_id filter
 * - Users can only access their own events
 * 
 * @async
 * @function getUserEvents
 * 
 * @param {SupabaseClient} supabase - Supabase client instance with authenticated user context
 * @param {GetUserEventsCommand} command - Query command containing:
 *   - userId: UUID of the user whose events to retrieve
 *   - saved: Optional boolean filter for saved status
 *   - category: Optional string filter for event category
 *   - age_category: Optional string filter for age category
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 *   - sort: Sort field (default: "created_at")
 *   - order: Sort direction (default: "desc")
 * 
 * @returns {Promise<GetUserEventsResult>} Promise resolving to an object containing:
 *   - data: Array of EventListItemDTO (excludes model_version field)
 *   - pagination: PaginationDTO with metadata (page, limit, total, total_pages, has_next, has_prev)
 * 
 * @throws {EventServiceError} With statusCode 500 and code "COUNT_FAILED" if counting events fails
 * @throws {EventServiceError} With statusCode 500 and code "QUERY_FAILED" if fetching events fails
 * @throws {EventServiceError} With statusCode 500 and code "UNEXPECTED_ERROR" for unhandled errors
 * 
 * @example
 * ```typescript
 * // Get first page of all saved events
 * const result = await getUserEvents(supabase, {
 *   userId: "user-uuid",
 *   saved: true,
 *   page: 1,
 *   limit: 10
 * });
 * console.log(`Found ${result.pagination.total} saved events`);
 * console.log(`Page ${result.pagination.page} of ${result.pagination.total_pages}`);
 * ```
 * 
 * @example
 * ```typescript
 * // Get music events sorted by date
 * const result = await getUserEvents(supabase, {
 *   userId: "user-uuid",
 *   category: "muzyka",
 *   sort: "event_date",
 *   order: "asc",
 *   page: 1,
 *   limit: 20
 * });
 * result.data.forEach(event => {
 *   console.log(`${event.title} on ${event.event_date}`);
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Get events for children, newest first
 * const result = await getUserEvents(supabase, {
 *   userId: "user-uuid",
 *   age_category: "dzieci",
 *   sort: "created_at",
 *   order: "desc"
 * });
 * // Default pagination: page=1, limit=20
 * ```
 * 
 * @see {@link GetUserEventsCommand} for command interface details
 * @see {@link GetUserEventsResult} for result interface details
 * @see {@link PaginationDTO} for pagination metadata structure
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
 * Retrieves a single event by its unique identifier.
 * 
 * This function fetches a specific event for the authenticated user with:
 * - Strict ownership validation (user must own the event)
 * - Double security layer (RLS + explicit user_id filter)
 * - Complete event data including all fields
 * 
 * The function is typically used for:
 * - Displaying event details
 * - Pre-populating edit forms
 * - Verifying event ownership before operations
 * 
 * Security:
 * - RLS policies enforce user_id matching
 * - Explicit .eq("user_id", userId) provides additional safety
 * - Returns 404 if event doesn't exist OR user doesn't have access
 * 
 * @async
 * @function getEventById
 * 
 * @param {SupabaseClient} supabase - Supabase client instance with authenticated user context
 * @param {GetEventByIdCommand} command - Retrieval command containing:
 *   - eventId: UUID of the event to retrieve
 *   - userId: UUID of the user requesting the event
 * 
 * @returns {Promise<GetEventByIdResult>} Promise resolving to an object containing the full event object
 * 
 * @throws {EventServiceError} With statusCode 404 and code "EVENT_NOT_FOUND" if:
 *   - Event doesn't exist
 *   - Event exists but belongs to a different user
 *   - Database returns PGRST116 (no rows)
 * @throws {EventServiceError} With statusCode 500 and code "EVENT_FETCH_FAILED" if database query fails
 * @throws {EventServiceError} With statusCode 500 and code "UNEXPECTED_ERROR" for unhandled errors
 * 
 * @example
 * ```typescript
 * // Retrieve an event for display
 * try {
 *   const result = await getEventById(supabase, {
 *     eventId: "event-uuid",
 *     userId: "user-uuid"
 *   });
 *   console.log(result.event.title);
 *   console.log(result.event.generated_description);
 * } catch (error) {
 *   if (error instanceof EventServiceError && error.code === "EVENT_NOT_FOUND") {
 *     console.log("Event not found or access denied");
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Use in an API endpoint
 * const { eventId } = params;
 * const { userId } = session;
 * 
 * const result = await getEventById(supabase, { eventId, userId });
 * return new Response(JSON.stringify(result.event), {
 *   status: 200,
 *   headers: { "Content-Type": "application/json" }
 * });
 * ```
 * 
 * @see {@link GetEventByIdCommand} for command interface details
 * @see {@link GetEventByIdResult} for result interface details
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
 * Performs soft delete on an event by setting the saved flag to false.
 * 
 * This function implements non-destructive deletion with the following workflow:
 * 1. Updates the event's saved field to false
 * 2. Validates event ownership and authentication status
 * 3. Logs the deletion action for audit purposes
 * 4. Returns confirmation of successful deletion
 * 
 * Soft Delete Behavior:
 * - Event record remains in database (not physically deleted)
 * - saved=false flags the event as "removed from saved list"
 * - Event can potentially be restored by setting saved=true
 * - Maintains data integrity and audit trail
 * 
 * Business Rules:
 * - Only events created by authenticated users can be soft deleted
 * - Guest-created events cannot be modified (403 error)
 * - Only the event owner can perform deletion (validated via RLS + explicit user_id check)
 * - Deletion action is logged in event_management_logs as "event_deleted"
 * 
 * Security:
 * - Double security: RLS policies + explicit user_id filter
 * - Additional validation of created_by_authenticated_user flag
 * - Prevents unauthorized access or modification
 * 
 * @async
 * @function softDeleteEvent
 * 
 * @param {SupabaseClient} supabase - Supabase client instance with authenticated user context
 * @param {SoftDeleteEventCommand} command - Deletion command containing:
 *   - eventId: UUID of the event to soft delete
 *   - userId: UUID of the user performing the deletion
 * 
 * @returns {Promise<SoftDeleteEventResult>} Promise resolving to an object containing:
 *   - eventId: UUID of the deleted event
 *   - message: Confirmation message ("Event removed from saved list")
 * 
 * @throws {EventServiceError} With statusCode 404 and code "EVENT_NOT_FOUND" if:
 *   - Event doesn't exist
 *   - Event exists but belongs to a different user
 *   - Database returns PGRST116 (no rows)
 * @throws {EventServiceError} With statusCode 403 and code "GUEST_EVENT_MODIFICATION" if:
 *   - Attempting to delete an event created by a guest user
 *   - Event has created_by_authenticated_user=false
 * @throws {EventServiceError} With statusCode 500 and code "EVENT_SOFT_DELETE_FAILED" if database update fails
 * @throws {EventServiceError} With statusCode 500 and code "UNEXPECTED_ERROR" for unhandled errors
 * 
 * @example
 * ```typescript
 * // Remove an event from user's saved list
 * try {
 *   const result = await softDeleteEvent(supabase, {
 *     eventId: "event-uuid",
 *     userId: "user-uuid"
 *   });
 *   console.log(result.message); // "Event removed from saved list"
 * } catch (error) {
 *   if (error instanceof EventServiceError) {
 *     if (error.code === "GUEST_EVENT_MODIFICATION") {
 *       console.log("Cannot delete guest-created events");
 *     } else if (error.code === "EVENT_NOT_FOUND") {
 *       console.log("Event not found or access denied");
 *     }
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Use in a DELETE API endpoint
 * const { eventId } = params;
 * const { userId } = session;
 * 
 * const result = await softDeleteEvent(supabase, { eventId, userId });
 * return new Response(JSON.stringify(result), {
 *   status: 200,
 *   headers: { "Content-Type": "application/json" }
 * });
 * ```
 * 
 * @see {@link SoftDeleteEventCommand} for command interface details
 * @see {@link SoftDeleteEventResult} for result interface details
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
