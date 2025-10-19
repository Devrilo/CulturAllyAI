import type { APIRoute } from "astro";
import { z } from "zod";
import { updateEventSchema } from "../../../lib/validators/events";
import { updateEvent, getEventById, EventServiceError } from "../../../lib/services/events.service";
import type { ErrorResponseDTO, EventResponseDTO, UpdateEventDTO, ValidationErrorDTO } from "../../../types";

export const prerender = false;

const eventIdSchema = z.string().uuid({ message: "Identyfikator wydarzenia musi być prawidłowym UUID" });

/**
 * GET /api/events/:id
 * Retrieves a single event by ID for the authenticated user
 *
 * @param params - Contains event ID from URL path
 * @param locals - Contains Supabase client instance
 * @returns 200 with EventResponseDTO or error response
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate path parameter (UUID)
    const idResult = eventIdSchema.safeParse(params?.id);

    if (!idResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Parametr ID jest nieprawidłowy",
          details: [
            {
              field: "id",
              message: idResult.error.errors[0]?.message ?? "Identyfikator wydarzenia jest nieprawidłowy",
            },
          ],
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const eventId = idResult.data;

    // Step 2: Authenticate user (required)
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

    // Step 3: Get event via service
    const { event } = await getEventById(supabase, {
      eventId,
      userId: user.id,
    });

    // Step 4: Return success response
    return new Response(JSON.stringify(event satisfies EventResponseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors (404, 500)
    if (error instanceof EventServiceError) {
      const mapped = mapEventServiceError(error);

      return new Response(JSON.stringify(mapped.body satisfies ErrorResponseDTO), {
        status: mapped.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors (500)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/events/:id:", error);

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

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const idResult = eventIdSchema.safeParse(params?.id);

  if (!idResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation Error",
        message: "Przesłano nieprawidłowy identyfikator wydarzenia",
        details: [
          {
            field: "id",
            message: idResult.error.errors[0]?.message ?? "Identyfikator wydarzenia jest nieprawidłowy",
          },
        ],
      } satisfies ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

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

  const validationResult = updateEventSchema.safeParse(body);

  if (!validationResult.success) {
    const details: ValidationErrorDTO[] = validationResult.error.errors.map((err) => ({
      field: err.path.length > 0 ? err.path.join(".") : "body",
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

  const payload = validationResult.data as UpdateEventDTO;
  const supabase = locals.supabase;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Brak autoryzacji do wykonania tej operacji",
      } satisfies ErrorResponseDTO),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { event } = await updateEvent(supabase, {
      eventId: idResult.data,
      userId: user.id,
      payload,
    });

    return new Response(JSON.stringify(event satisfies EventResponseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof EventServiceError) {
      const mapped = mapEventServiceError(error);

      return new Response(JSON.stringify(mapped.body satisfies ErrorResponseDTO), {
        status: mapped.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error in PATCH /api/events/:id:", error);

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
 * DELETE /api/events/:id
 * Performs soft delete on an event by setting saved = false
 * Only accessible by the event owner and for events created by authenticated users
 *
 * @param params - Contains event ID from URL path
 * @param locals - Contains Supabase client instance
 * @returns 200 with MessageResponseDTO or error response
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate path parameter (UUID)
    const idResult = eventIdSchema.safeParse(params?.id);

    if (!idResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Parametr ID jest nieprawidłowy",
          details: [
            {
              field: "id",
              message: idResult.error.errors[0]?.message ?? "Identyfikator wydarzenia jest nieprawidłowy",
            },
          ],
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const eventId = idResult.data;

    // Step 2: Authenticate user (required)
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

    // Step 3: Soft delete event via service (sets saved = false)
    const result = await softDeleteEvent(supabase, {
      eventId,
      userId: user.id,
    });

    // Step 4: Return success response
    return new Response(
      JSON.stringify({
        message: result.message,
        id: result.eventId,
      } satisfies MessageResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle service errors (403, 404, 500)
    if (error instanceof EventServiceError) {
      const mapped = mapEventServiceError(error);

      return new Response(JSON.stringify(mapped.body satisfies ErrorResponseDTO), {
        status: mapped.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors (500)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in DELETE /api/events/:id:", error);

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

function mapEventServiceError(error: EventServiceError): { status: number; body: ErrorResponseDTO } {
  switch (error.code) {
    case "EVENT_NOT_FOUND":
      return {
        status: 404,
        body: {
          error: "Not Found",
          message: error.message,
        },
      };
    case "GUEST_EVENT_UPDATE_FORBIDDEN":
    case "GUEST_EVENT_MODIFICATION":
      return {
        status: 403,
        body: {
          error: "Forbidden",
          message: error.message,
        },
      };
    case "NO_FIELDS_TO_UPDATE":
      return {
        status: 400,
        body: {
          error: "Bad Request",
          message: error.message,
        },
      };
    case "EVENT_FETCH_FAILED":
    case "UPDATE_FAILED":
    case "EVENT_SOFT_DELETE_FAILED":
      return {
        status: 500,
        body: {
          error: "Service Error",
          message: error.message,
        },
      };
    default:
      return {
        status: error.statusCode ?? 500,
        body: {
          error: error.code || "Service Error",
          message: error.message,
        },
      };
  }
}
