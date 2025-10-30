import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

/**
 * MSW (Mock Service Worker) Setup
 * Example handlers for mocking API requests in tests
 */

// Define mock handlers
export const handlers = [
  // Mock GET /api/events
  http.get("/api/events", () => {
    return HttpResponse.json([{ id: "1", title: "Test Event", description: "Test Description" }]);
  }),

  // Mock POST /api/events
  http.post("/api/events", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: "new-id",
        ...body,
      },
      { status: 201 }
    );
  }),

  // Mock error response
  http.get("/api/events/:id", ({ params }) => {
    const { id } = params;
    if (id === "error") {
      return HttpResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return HttpResponse.json({ id, title: "Event" });
  }),
];

// Setup server instance
export const server = setupServer(...handlers);

// Usage in tests:
// beforeAll(() => server.listen())
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())
