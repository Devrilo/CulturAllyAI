import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// ============================================================================
// EVENT DTOs
// ============================================================================

/**
 * Request body for creating a new event with AI generation
 * POST /api/events
 * Derived from events table Insert type, picking only user-provided fields
 */
export type CreateEventDTO = Pick<
  TablesInsert<"events">,
  "title" | "city" | "event_date" | "category" | "age_category" | "key_information"
>;

/**
 * Complete event object response
 * POST /api/events (creation response), GET /api/events/:id
 * Uses full Row type from events table
 */
export type EventResponseDTO = Tables<"events">;

/**
 * Request body for updating an event
 * PATCH /api/events/:id
 * Only allows updating saved status, feedback, and edited description
 */
export type UpdateEventDTO = Partial<Pick<TablesUpdate<"events">, "saved" | "feedback" | "edited_description">>;

/**
 * Event item in list responses (omits internal metadata)
 * GET /api/events
 */
export type EventListItemDTO = Omit<Tables<"events">, "model_version">;

/**
 * Query parameters for filtering and paginating events
 * GET /api/events
 */
export interface EventsQueryDTO {
  saved?: boolean;
  category?: Enums<"event_category">;
  age_category?: Enums<"age_category">;
  page?: number;
  limit?: number;
  sort?: "created_at" | "event_date" | "title";
  order?: "asc" | "desc";
}

/**
 * Paginated list of events response
 * GET /api/events
 */
export interface EventsListResponseDTO {
  data: EventListItemDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// CATEGORIES DTOs
// ============================================================================

/**
 * Event category with value and label
 * GET /api/categories/events
 */
export interface EventCategoryDTO {
  value: Enums<"event_category">;
  label: string;
}

/**
 * Age category with value and label
 * GET /api/categories/age
 */
export interface AgeCategoryDTO {
  value: Enums<"age_category">;
  label: string;
}

/**
 * Response for event categories
 * GET /api/categories/events
 */
export interface EventCategoriesResponseDTO {
  categories: EventCategoryDTO[];
}

/**
 * Response for age categories
 * GET /api/categories/age
 */
export interface AgeCategoriesResponseDTO {
  categories: AgeCategoryDTO[];
}

// ============================================================================
// PAGINATION DTO
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

// ============================================================================
// COMMON RESPONSE DTOs
// ============================================================================

/**
 * Generic success message response
 * Used for logout, password change, account deletion, event deletion
 */
export interface MessageResponseDTO {
  message: string;
  id?: string;
}

/**
 * Validation error detail
 */
export interface ValidationErrorDTO {
  field: string;
  message: string;
}

/**
 * Generic error response
 * Used for all error cases (400, 401, 403, 404, 500, 503)
 */
export interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: ValidationErrorDTO[];
}

// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

/**
 * Request body for logging auth activity
 * POST /api/auth/activity
 */
export interface AuthActivityDTO {
  action_type: Enums<"user_action_type">;
  metadata?: Record<string, unknown>;
}

/**
 * Request body for changing password
 * Used in ChangePasswordModal (client-side only - calls Supabase directly)
 */
export interface ChangePasswordRequestDTO {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Request body for deleting account
 * POST /api/auth/delete-account
 */
export interface DeleteAccountRequestDTO {
  password: string;
  confirmDeletion: boolean;
}

// ============================================================================
// AUDIT LOG DTOs (for internal use)
// ============================================================================

/**
 * User activity log entry
 * Derived from user_activity_logs table
 */
export type UserActivityLogDTO = Tables<"user_activity_logs">;

/**
 * Event management log entry
 * Derived from event_management_logs table
 */
export type EventManagementLogDTO = Tables<"event_management_logs">;

/**
 * Insert type for creating user activity logs
 */
export type CreateUserActivityLogDTO = TablesInsert<"user_activity_logs">;

/**
 * Insert type for creating event management logs
 */
export type CreateEventManagementLogDTO = TablesInsert<"event_management_logs">;

// ============================================================================
// ENUM RE-EXPORTS (for convenience)
// ============================================================================

/**
 * Event category enum
 */
export type EventCategory = Enums<"event_category">;

/**
 * Age category enum
 */
export type AgeCategory = Enums<"age_category">;

/**
 * Feedback enum
 */
export type Feedback = Enums<"feedback">;

/**
 * User action type enum
 */
export type UserActionType = Enums<"user_action_type">;

/**
 * Event action type enum
 */
export type EventActionType = Enums<"event_action_type">;

// ============================================================================
// GENERATOR VIEW TYPES (Frontend-only)
// ============================================================================

/**
 * Form values for event creation in Generator view
 */
export interface EventFormValues {
  title: string;
  event_date: string;
  city: string;
  category: EventCategory;
  age_category: AgeCategory;
  key_information: string;
}

/**
 * Form validation errors mapped by field name
 */
export type EventFormErrors = Partial<Record<keyof EventFormValues, string>> & {
  form?: string;
};

/**
 * View model for generated event with UI-friendly labels
 */
export interface GeneratedEventViewModel {
  id: string;
  title: string;
  city: string;
  event_date: string;
  categoryLabel: string;
  ageCategoryLabel: string;
  key_information: string;
  description: string;
  saved: boolean;
  feedback: Feedback | null;
  createdByAuthenticated: boolean;
  updatedAt: string;
}

/**
 * Authentication state for Generator view
 */
export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  status: "loading" | "ready" | "error";
}

/**
 * Generator operation status tracking
 */
export interface GeneratorStatus {
  isGenerating: boolean;
  isSaving: boolean;
  isCopying: boolean;
  errorCode?: string;
  lastSuccessAt?: number;
  timeoutElapsed: boolean;
}

/**
 * Action availability based on state and auth
 */
export interface ActionAvailability {
  canGenerate: boolean;
  canSave: boolean;
  canCopy: boolean;
  canRate: boolean;
}

/**
 * Rating state tracking
 */
export interface RatingState {
  current: Feedback | null;
  locked: boolean;
}

/**
 * Complete Generator view state
 */
export interface GeneratorViewState {
  form: EventFormValues;
  errors: EventFormErrors;
  generated: GeneratedEventViewModel | null;
  status: GeneratorStatus;
  auth: AuthState;
  availability: ActionAvailability;
  rating: RatingState;
}

/**
 * Alias for event categories query data
 */
export type CategoriesQueryData = EventCategoryDTO[];

/**
 * Alias for age categories query data
 */
export type AgeCategoriesQueryData = AgeCategoryDTO[];

// ============================================================================
// EVENTS VIEW TYPES (Frontend-only)
// ============================================================================

/**
 * View model for saved events in the Events page
 * Maps EventListItemDTO to UI-friendly format with labels
 */
export interface SavedEventViewModel {
  id: string;
  title: string;
  city: string;
  eventDateISO: string;
  eventDateLabel: string;
  category: EventCategory;
  categoryLabel: string;
  ageCategory: AgeCategory;
  ageCategoryLabel: string;
  keyInformation: string;
  description: string;
  editedDescription: string | null;
  feedback: Feedback | null;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
  isGuestOwned: boolean;
  charCount: number;
}

/**
 * Filter state for Events page
 */
export interface EventsFiltersState {
  category?: EventCategory;
  age_category?: AgeCategory;
  sort: "created_at" | "event_date" | "title";
  order: "asc" | "desc";
  page: number;
  saved: true;
}

/**
 * Sort option combining sort field and order
 */
export interface EventsSortOption {
  sort: EventsFiltersState["sort"];
  order: EventsFiltersState["order"];
}

/**
 * Summary statistics for Events page
 */
export interface EventsSummaryStats {
  total: number;
  activeFilters: number;
}

/**
 * Status of events list loading
 */
export interface EventsListStatus {
  isLoading: boolean;
  isFetchingNext: boolean;
  isError: boolean;
  errorCode?: string;
}

/**
 * Payload for editing event description
 */
export interface EditPayload {
  id: string;
  edited_description: string;
}

/**
 * Payload for rating event
 */
export interface RatePayload {
  id: string;
  feedback: Feedback;
}

/**
 * State of inline edit form
 */
export interface EditFormState {
  value: string;
  charsLeft: number;
  error?: string;
}

/**
 * State of mutations for event cards
 */
export interface EventMutationState {
  editing: Record<string, boolean>;
  rating: Record<string, boolean>;
  deleting: Record<string, boolean>;
  error?: string;
}
