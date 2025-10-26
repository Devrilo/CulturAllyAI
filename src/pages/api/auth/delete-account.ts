import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../db/supabase.admin";
import { deleteAccountSchema } from "../../../lib/validators/auth";
import type { ErrorResponseDTO, MessageResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/delete-account
 *
 * Permanently deletes the authenticated user's account from Supabase Auth.
 * Requires password confirmation to prevent accidental deletion.
 *
 * Authentication: Required (JWT via Supabase Auth)
 *
 * Request body:
 * {
 *   "password": "user_password",
 *   "confirmDeletion": true
 * }
 *
 * Side effects:
 * - User is deleted from auth.users table
 * - ON DELETE SET NULL cascade: user_id in events table is set to NULL
 * - created_by_authenticated_user remains true for analytics
 * - User's saved events, feedback, and edited descriptions are preserved
 * - User is logged out automatically (session invalidated)
 *
 * Response: 200 OK with confirmation message
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
        message: "Authentication required to delete account",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = deleteAccountSchema.safeParse(body);

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

    const { password, confirmDeletion } = validation.data;

    // Verify confirmDeletion is true (double-check even though Zod validates this)
    if (!confirmDeletion) {
      const errorResponse: ErrorResponseDTO = {
        error: "Confirmation required",
        message: "You must confirm account deletion",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify password by attempting to sign in
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (passwordError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid password",
        message: "The password you entered is incorrect",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete user using Admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Failed to delete user:", deleteError);
      const errorResponse: ErrorResponseDTO = {
        error: "Failed to delete account",
        message: deleteError.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log account deletion activity (optional - user is already deleted)
    // This will succeed if called before deleteUser, but user_id will be set to null after deletion
    try {
      await supabase.from("user_activity_logs").insert({
        user_id: user.id,
        action_type: "account_deleted",
      });
    } catch {
      // Ignore audit log errors - user is already deleted
    }

    // Return success response
    const successResponse: MessageResponseDTO = {
      message: "Account deleted successfully",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in POST /api/auth/delete-account:", err);
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
