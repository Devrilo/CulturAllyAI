import type { APIRoute } from "astro";
import type { EventCategoriesResponseDTO, ErrorResponseDTO } from "../../../types";
import { getEventCategories } from "../../../lib/services/categories.service";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/categories/events
 *
 * Returns a list of available event categories with enum values and Polish labels.
 * This is a public endpoint that does not require authentication.
 *
 * @returns {EventCategoriesResponseDTO} 200 - List of event categories
 * @returns {ErrorResponseDTO} 500 - Internal server error
 */
export const GET: APIRoute = async () => {
  try {
    // Get event categories from service
    const categories = getEventCategories();

    // Prepare response
    const response: EventCategoriesResponseDTO = {
      categories,
    };

    // Return success response with cache headers
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    // Handle unexpected errors (500)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/categories/events:", error);

    // Return generic error response
    const errorResponse: ErrorResponseDTO = {
      error: "Internal Server Error",
      message: "Wystąpił nieoczekiwany błąd serwera",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
