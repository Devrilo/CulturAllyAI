import type { APIRoute } from "astro";
import { authActivitySchema } from "../../../lib/validators/auth";
import type { ErrorResponseDTO, MessageResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/activity
 *
 * Records user activity in user_activity_logs table for audit purposes.
 * Used to track authentication-related events (login, logout, account_created, etc.)
 *
 * Authentication: Required (JWT via Supabase Auth)
 *
 * Request body:
 * {
 *   "action_type": "login" | "logout" | "account_created" | "password_changed" | "account_deleted" | "session_expired",
 *   "metadata": { ... } // Optional additional context
 * }
 *
 * Response: 201 Created with confirmation message
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  try {
    // Verify authentication - get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Unauthorized",
        message: "Authentication required to log activity",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = authActivitySchema.safeParse(body);

    if (!validation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        message: "Invalid request body",
        details: validation.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { action_type } = validation.data;

    // Insert activity log
    const { error: insertError } = await supabase.from("user_activity_logs").insert({
      user_id: user.id,
      action_type,
    });

    if (insertError) {
      console.error("Failed to insert activity log:", insertError);
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to log activity",
        message: insertError.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    const successResponse: MessageResponseDTO = {
      message: "Activity logged successfully",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in POST /api/auth/activity:", err);
    const errorResponse: ErrorResponseDTO = {
      error: "Internal server error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
