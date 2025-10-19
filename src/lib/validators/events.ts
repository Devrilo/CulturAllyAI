import { z } from "zod";
import { Constants } from "../../db/database.types";

/**
 * Validation schema for CreateEventDTO
 * Validates all required fields for event creation with AI generation
 */
export const createEventSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany").max(100, "Tytuł nie może przekraczać 100 znaków").trim(),
  city: z.string().min(1, "Miasto jest wymagane").max(50, "Miasto nie może przekraczać 50 znaków").trim(),
  event_date: z
    .string()
    .datetime({ message: "Data musi być w formacie ISO 8601" })
    .refine(
      (date) => {
        const eventDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
      },
      { message: "Data wydarzenia nie może być w przeszłości" }
    ),
  category: z.enum(Constants.public.Enums.event_category as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Nieprawidłowa kategoria wydarzenia" }),
  }),
  age_category: z.enum(Constants.public.Enums.age_category as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Nieprawidłowa kategoria wiekowa" }),
  }),
  key_information: z
    .string()
    .min(1, "Kluczowe informacje są wymagane")
    .max(200, "Kluczowe informacje nie mogą przekraczać 200 znaków")
    .trim(),
});

/**
 * Type inferred from createEventSchema
 */
export type CreateEventInput = z.infer<typeof createEventSchema>;

const feedbackEnum = z.enum(Constants.public.Enums.feedback as unknown as [string, ...string[]], {
  errorMap: () => ({ message: "Nieprawidłowa wartość opinii" }),
});

const editedDescriptionSchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    }

    return value;
  },
  z.union([z.string().max(500, "Opis nie może przekraczać 500 znaków"), z.null()])
);

/**
 * Validation schema for updating event fields
 * Ensures at least one field is provided and applies business constraints
 */
export const updateEventSchema = z
  .object({
    saved: z.boolean().optional(),
    feedback: feedbackEnum.nullable().optional(),
    edited_description: editedDescriptionSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.saved === undefined && data.feedback === undefined && data.edited_description === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Należy podać co najmniej jedno pole do aktualizacji",
        path: [],
      });
    }
  });

/**
 * Type inferred from updateEventSchema
 */
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/**
 * Validation schema for GET /api/events query parameters
 * Handles filtering, sorting, and pagination with proper type transformations
 */
export const getUserEventsQuerySchema = z.object({
  saved: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === "") return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  category: z
    .enum(Constants.public.Enums.event_category as unknown as [string, ...string[]], {
      errorMap: () => ({ message: "Nieprawidłowa kategoria wydarzenia" }),
    })
    .optional(),
  age_category: z
    .enum(Constants.public.Enums.age_category as unknown as [string, ...string[]], {
      errorMap: () => ({ message: "Nieprawidłowa kategoria wiekowa" }),
    })
    .optional(),
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === "") return 1;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === "") return 20;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 20;
      if (parsed > 100) return 100;
      return parsed;
    }),
  sort: z
    .enum(["created_at", "event_date", "title"], {
      errorMap: () => ({ message: "Nieprawidłowe pole sortowania" }),
    })
    .optional()
    .default("created_at"),
  order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "Nieprawidłowy kierunek sortowania" }),
    })
    .optional()
    .default("desc"),
});

/**
 * Type inferred from getUserEventsQuerySchema after transformations
 */
export type GetUserEventsQueryInput = z.infer<typeof getUserEventsQuerySchema>;

/**
 * Validation schema for GET /api/events/:id path parameters
 * Validates UUID format for event ID
 */
export const getEventByIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Nieprawidłowy format UUID" }),
});

/**
 * Type inferred from getEventByIdParamsSchema
 */
export type GetEventByIdParamsInput = z.infer<typeof getEventByIdParamsSchema>;
