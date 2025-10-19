import type { APIRoute } from "astro";
import { createEventSchema, getUserEventsQuerySchema } from "../../../lib/validators/events";
import {
  createEvent,
  getUserEvents,
  EventServiceError,
  type CreateEventCommand,
  type GetUserEventsCommand,
} from "../../../lib/services/events.service";
import { AIGenerationError } from "../../../lib/services/ai/generate-event-description";
import type {
  CreateEventDTO,
  ErrorResponseDTO,
  EventResponseDTO,
  ValidationErrorDTO,
  EventsListResponseDTO,
  EventsQueryDTO,
} from "../../../types";

export const prerender = false;

/**
 * POST /api/events
 * Creates a new event with AI-generated description
 *
 * @param request - Contains event data in JSON body
 * @param locals - Contains Supabase client instance
 * @returns 201 with EventResponseDTO or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Treść żądania nie jest poprawnym JSON",
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate against Zod schema
    const validationResult = createEventSchema.safeParse(body);

    if (!validationResult.success) {
      const details: ValidationErrorDTO[] = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Dane wejściowe są nieprawidłowe",
          details,
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = validationResult.data;

    // Step 3: Extract user from JWT token (optional for guests)
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // If token is present but invalid, return 401
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authError) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Token autoryzacji jest nieprawidłowy",
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Prepare command for service
    // Note: Zod validates enum values but infers them as strings, so we assert the type here
    const command: CreateEventCommand = {
      ...(validatedData as CreateEventDTO),
      userId: user?.id || null,
      isAuthenticated: !!user,
    };

    // Step 5: Create event via service
    const { event } = await createEvent(supabase, command);

    // Step 6: Return success response
    return new Response(JSON.stringify(event satisfies EventResponseDTO), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle AI generation errors (503)
    if (error instanceof AIGenerationError) {
      return new Response(
        JSON.stringify({
          error: "Service Unavailable",
          message: error.message,
        } satisfies ErrorResponseDTO),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle service errors (400, 500)
    if (error instanceof EventServiceError) {
      return new Response(
        JSON.stringify({
          error: error.code || "Service Error",
          message: error.message,
        } satisfies ErrorResponseDTO),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors (500)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/events:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd serwera",
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/events
 * Retrieves a paginated list of events for the authenticated user
 * Supports filtering, sorting, and pagination
 *
 * @param request - Contains query parameters for filtering and pagination
 * @param locals - Contains Supabase client instance
 * @returns 200 with EventsListResponseDTO or error response
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Extract and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      saved: url.searchParams.get("saved") || undefined,
      category: url.searchParams.get("category") || undefined,
      age_category: url.searchParams.get("age_category") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    };

    const validationResult = getUserEventsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const details: ValidationErrorDTO[] = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Parametry zapytania są nieprawidłowe",
          details,
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedQuery = validationResult.data;

    // Step 2: Authenticate user (required for GET)
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Wymagana jest autoryzacja",
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Prepare command for service
    const command: GetUserEventsCommand = {
      userId: user.id,
      saved: validatedQuery.saved,
      category: validatedQuery.category as EventsQueryDTO["category"],
      age_category: validatedQuery.age_category as EventsQueryDTO["age_category"],
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sort: validatedQuery.sort as EventsQueryDTO["sort"],
      order: validatedQuery.order as EventsQueryDTO["order"],
    };

    // Step 4: Get events via service
    const result = await getUserEvents(supabase, command);

    // Step 5: Return success response
    return new Response(JSON.stringify(result satisfies EventsListResponseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors (400, 500)
    if (error instanceof EventServiceError) {
      return new Response(
        JSON.stringify({
          error: error.code || "Service Error",
          message: error.message,
        } satisfies ErrorResponseDTO),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors (500)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/events:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd serwera",
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
