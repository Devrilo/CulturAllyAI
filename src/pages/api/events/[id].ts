import type { APIRoute } from "astro";
import { z } from "zod";
import { updateEventSchema } from "../../../lib/validators/events";
import { updateEvent, EventServiceError } from "../../../lib/services/events.service";
import type { ErrorResponseDTO, EventResponseDTO, UpdateEventDTO, ValidationErrorDTO } from "../../../types";

export const prerender = false;

const eventIdSchema = z.string().uuid({ message: "Identyfikator wydarzenia musi być prawidłowym UUID" });

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
