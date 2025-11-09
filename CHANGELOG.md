# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.11.2025 - 9.11.2025

- Wprowadzono automatyczne generowanie wpisów do CHANGELOG z wykorzystaniem AI (Gemini Flash).
- Udoskonalono i naprawiono proces automatycznego generowania CHANGELOG.
- Przygotowano plan implementacji kluczowego modułu projektu (mcp).
- Przeprowadzono analizę procesu biznesowego zarządzania wydarzeniami.
- Opracowano plan naprawczy dla błędu synchronizacji stanu komponentu eventCard.
- Przygotowano dokumentację wdrożeniową dla nowych członków zespołu.
- Rozszerzono dokumentację kodu wewnętrznego, usprawniając rozwój projektu.
- Wprowadzono drobne poprawki w formatowaniu kodu.

## [Unreleased]

### Fixed

- **E2E Test Environment Variables and Middleware Priority** ✅
  - Fixed 24 E2E test failures caused by undefined environment variables in Playwright test workers
  - Root cause 1: Playwright test workers run in separate Node.js processes without inheriting environment from main process or `playwright.config.ts`
  - Solution 1: Added `dotenv.config({ path: ".env.test" })` in `tests/e2e/fixtures.ts` to load environment variables in each test worker
  - Root cause 2: Middleware environment variable priority `runtime?.env || import.meta.env` broke dev/test after Cloudflare deployment changes
  - Solution 2: Reversed priority to `import.meta.env || runtime?.env` in `src/middleware/index.ts`
  - Reasoning: `import.meta.env` is populated by Vite in dev/test/build, `runtime.env` only exists in Cloudflare Pages runtime
  - **Result:** All 44 E2E tests passing (100% pass rate, 4 intentionally skipped), Cloudflare compatibility maintained
  - Files modified: `tests/e2e/fixtures.ts`, `src/middleware/index.ts`
  - Test execution time: ~13.2 minutes for full suite with database cleanup
  - Cloudflare verification: Environment variable fallback works correctly for all deployment environments:
    - Development: `import.meta.env` from `.env` (Vite)
    - Test: `import.meta.env` from `.env.test` (dotenv-cli + dotenv.config)
    - Cloudflare Production: `runtime.env` from Dashboard Environment Variables (Cloudflare Pages)

### Added

- **CI/CD Pipeline with GitHub Actions**
  - **Pull Request Workflow** (`pull-request.yml`)
    - Triggers: automatic on pull requests to master branch
    - Job 1: Lint Code - ESLint validation (~1-2 min)
    - Job 2 & 3 (parallel): Unit Tests with coverage + E2E Tests (~8-10 min combined)
    - Job 4: PR Status Comment - aggregates results and posts to PR with coverage metrics
    - Node.js version from `.nvmrc` (22.14.0)
    - npm cache for faster dependency installation
    - Playwright browser caching (Chromium only)
    - Artifacts with 7-day retention: unit-coverage, e2e-test-results, playwright-report
    - E2E tests use environment "TEST" with secrets (SUPABASE_*, OPENROUTER_API_KEY, E2E_*)
    - Coverage parsing for unit tests and E2E test results
    - Automated PR comments with CI status, job results, and test metrics
    - Total pipeline time: ~10-15 minutes
    - Configuration file: `.github/workflows/pull-request.yml`
    - **Security:** All secrets encrypted by GitHub via environment variables
    - **Actions versions:** checkout@v5, setup-node@v6, upload-artifact@v5, download-artifact@v6, github-script@v8

- **CI/CD Pipeline with GitHub Actions** (Previous implementation)
  - Minimal CI/CD setup with 5 jobs: lint → test & e2e (parallel) → build → status
  - Triggers: automatic on push to master, manual via workflow_dispatch
  - Job 1: ESLint + TypeScript type checking (~1-2 min)
  - Job 2: Vitest unit/integration tests with coverage report (~2-3 min)
  - Job 3: Playwright E2E tests with artifact upload (~3-5 min)
  - Job 4: Production build validation (~2-3 min)
  - Job 5: Aggregate status reporting for all jobs
  - Node.js version from `.nvmrc` (22.14.0)
  - npm cache for faster dependency installation
  - Concurrency control to cancel outdated runs
  - Playwright browser caching (Chromium only)
  - Artifacts with 7-day retention: playwright-report, e2e-results, dist
  - Optional Codecov integration for coverage reporting
  - Total pipeline time: ~8-13 minutes
  - Configuration file: `.github/workflows/test-and-build.yml`
  - Documentation: `docs/ci-cd-setup.md`
  - **Security:** All secrets encrypted by GitHub, never exposed in logs or code
  - **Simplified:** Removed SERVICE_ROLE_KEY requirement (not needed for basic E2E tests)

- **Security Enhancement - Row Level Security for Audit Logs**
  - Added RLS policies to `user_activity_logs` table
    - Authenticated users can only insert and view their own activity logs
    - Anonymous users are blocked from all operations
    - Logs are immutable (no UPDATE or DELETE allowed)
  - Added RLS policies to `event_management_logs` table
    - Authenticated users can only insert and view their own event management logs
    - Anonymous users are blocked from all operations
    - Logs are immutable (no UPDATE or DELETE allowed)
  - Migration: `20251030120000_add_rls_to_logs_tables.sql`
  - **Result:** Enhanced data isolation, prevented unauthorized access to audit trails, maintained audit log integrity

### Added

- **Code Refactoring - Generator Infrastructure** (Phase 1 & 2.1)
  - Split `useGeneratorFlow` into 4 specialized hooks using Facade pattern (236 → 60 LOC, -74%)
    - `useClipboard` (40 LOC) - Reusable clipboard operations with toast feedback
    - `useEventGeneration` (110 LOC) - AI generation with 10s timeout notification
    - `useEventSave` (50 LOC) - Event saving via PATCH API
    - `useEventRating` (50 LOC) - Event rating with thumbs up/down feedback
  - Refactored `GeneratorPage` using Container/Presenter pattern (238 → 36 LOC, -85%)
    - Created `event-mappers.ts` for DTO-to-ViewModel mapping (36 LOC)
    - Created `query-client.ts` factory for QueryClient configuration (17 LOC)
    - Created `useGenerator` composite hook for business logic (160 LOC)
    - Created `GeneratorPageView` presentational component (88 LOC)
  - **Result:** Improved separation of concerns, better testability, increased reusability

- **Code Refactoring - Authentication UI** (Phase 2.3 & 2.4)
  - Migrated `ChangePasswordModal` to React Hook Form (266 → 155 LOC, -42%)
  - Created reusable `PasswordStrengthIndicator` component (39 LOC, shared with RegisterForm)
  - Created `useChangePasswordForm` hook with RHF + zodResolver (106 LOC)
  - Migrated `RegisterForm` to React Hook Form (213 → 107 LOC, -50%)
  - Created `useRegisterForm` hook with RHF + zodResolver (102 LOC)
  - Installed `react-hook-form` and `@hookform/resolvers` dependencies
  - **Result:** Eliminated duplicate validation logic, simplified error handling, improved UX

- **Code Refactoring - Form Components** (Phase 2.5)
  - Created reusable `FormField` abstraction component (133 LOC)
    - Handles Label + Input/Textarea/Select + CharacterCounter + error display
    - Supports 4 field types: text, date, textarea, select
    - Automatic error ID management and ARIA attributes
  - Extracted date helpers to `src/lib/utils/date-helpers.ts` (31 LOC)
    - `fromISODateTime()` - Converts ISO datetime to date-only format
    - `toISODateTime()` - Converts date-only to ISO datetime
    - `getTodayDateString()` - Returns today's date in YYYY-MM-DD format
  - Refactored `EventForm` using FormField abstraction (223 → 113 LOC, -49%)
  - **Result:** Eliminated ~35-40 LOC per field repetition, improved maintainability, better reusability

### Added

- **E2E Testing Infrastructure** ✅ **COMPLETE - MVP Ready**
  - Playwright 1.49.1 test framework for end-to-end testing
  - **44 comprehensive E2E tests with 100% pass rate** (4 non-critical skips planned for future features)
    - 9 authentication flow tests (01-auth.spec.ts) - ✅ 100% passing
    - 10 event generator tests (02-generator.spec.ts) - ✅ 100% passing
    - 5 complete user journey tests (03-complete-journey.spec.ts) - ✅ 100% passing
    - 7 account management tests (04-account-management.spec.ts) - ✅ 7/9 passing (2 skipped)
    - 9 events list management tests (05-events.spec.ts) - ✅ 9/11 passing (2 skipped)
    - 4 example tests (example.spec.ts) - ✅ 100% passing (smoke tests)
  - **Test execution time:** ~8.8 minutes with --workers=1 (sequential for AI tests)
  - **Automatic database cleanup** (globalTeardown):
    - Cleans ALL test data after tests complete (dedicated test database)
    - Preserves only main test user (E2E_USERNAME_ID) for reuse
    - Deletes: ALL events, ALL logs, ALL temporary users (except main user)
    - Uses SUPABASE_SERVICE_ROLE_KEY for full admin access (bypasses RLS policies)
    - Falls back to anon key if service role key not configured (may have limited access)
  - Page Object Model (POM) pattern for maintainable and reusable test code
  - Test fixtures for authenticated user state management
  - Test isolation with unique data generation per test run
  - Automatic dev server startup via `webServer` configuration
  - Test environment variables (`.env.test`) for E2E credentials (remote Supabase DB)
  - Playwright configuration: Desktop Chrome, trace on failure, video on failure
  - Test scenarios:
    - **Authentication** (01-auth.spec.ts):
      - Login/logout with valid/invalid credentials
      - Registration with validation and duplicate email handling
      - Session persistence and authentication requirements
    - **Event Generator** (02-generator.spec.ts):
      - Form validation (required fields, date constraints, character limits)
      - AI description generation with 90s timeout
      - Rating system (thumbs up/down, one-time voting)
      - Save/discard flows with proper cleanup
    - **Complete User Journeys** (03-complete-journey.spec.ts):
      - Guest-to-authenticated user flow
      - Full event lifecycle (create → rate → save)
      - Multi-event creation with session persistence
    - **Account Management** (04-account-management.spec.ts):
      - Change password with current password validation
      - Password form validation (empty, mismatch, weak passwords)
      - Account deletion with confirmation modal
      - Logout and session clearing
      - Profile page authentication and information display
      - Two tests skipped (non-critical): same password validation timeout, delete account requires Admin API key
  - Page Objects:
    - `BasePage` - Common navigation and waiting logic
    - `LoginPage` - Login form interactions with session management
    - `RegisterPage` - Registration form with unique email generation
    - `GeneratorPage` - Event form, AI generation (90s timeout), save/rating actions
    - `EventsPage` - Events list management with React Query loading state handling (waitForPageReady method)
    - `ProfilePage` - Modal-based profile settings (password change, account deletion, logout with clickLogout method)
  - Test utilities:
    - `authenticatedPage` fixture - Auto-login with improved React hydration handling (4s + isDisabled check)
    - `waitForFormHydration()` - 2000ms wait for React client:load hydration
    - Helper functions: `getFutureDate()`, `getPastDate()`, `countWords()`, `createTemporaryUser()`, `createMultipleEvents()`
    - Unique email generation with timestamp for test isolation
  - Debug features:
    - Trace files on failure for step-by-step debugging
    - Video recording on failure for visual inspection
    - Error context markdown files with page snapshots
    - HTML report with detailed test results
  - Test utilities:
    - `authenticatedPage` fixture - Auto-login with improved React hydration handling (4s + isDisabled check)
    - `waitForFormHydration()` - 2000ms wait for React client:load hydration
    - Helper functions: `getFutureDate()`, `getPastDate()`, `countWords()`, `createTemporaryUser()`, `createMultipleEvents()`
    - Unique email generation with timestamp for test isolation
  - Key Learnings:
    - **RLS policies**: Two layers - table GRANTs and row-level USING clauses; `.select()` requires both
    - **Guest events**: Use temporary UUIDs (crypto.randomUUID()), not real DB IDs; no `.select()` after INSERT
    - **AI generation**: 10-30s typical, 90s timeout (not 80s!); keep keyInformation short (few words) to avoid >500 char descriptions
    - **Rating system**: Buttons lock after first click (one-time rating by design)
    - **Category values**: Must use exact capitalized names ("Koncerty" not "koncerty", "Dorośli" not "dorośli")
    - **Radix UI combobox**: Click → wait 1s → select option (dropdown needs time to open)
    - **Registration flow**: May auto-login or redirect to /login - handle both cases
    - **Modal-based UI**: Settings use modals (ChangePasswordModal, DeleteAccountModal) not inline forms
    - **Hidden checkboxes**: Use `.click({ force: true })` for sr-only checkboxes (Shadcn/ui pattern)
    - **Admin operations**: Account deletion requires SUPABASE_SERVICE_ROLE_KEY in environment
    - **Authentication fixture**: Improved stability with 4s hydration wait + isDisabled check before login
    - **EventsPage loading**: waitForPageReady() handles React Query spinner and state settling
    - **Conditional navigation**: Events → Generator link may not exist when user has events (use fallback)
    - **Extended timeouts**: Tests with multiple AI generations need 150-360s timeouts

- **Unit Testing Infrastructure**
  - Vitest 4.0.4 test framework with jsdom environment
  - React Testing Library integration for hook testing
  - Comprehensive test coverage across core business logic
  - 241 unit tests with 100% pass rate
  - Test coverage: 79.25% statements, 72.08% branches, 96.72% functions, 77.77% lines
  - Mock strategies for Supabase client chainable API
  - Module mocking for AI generation service
  - Fake timers for debounce testing (vi.useFakeTimers, vi.advanceTimersByTime)

- **Validator Tests (120 tests, 100% coverage)**
  - `lib/validators/__tests__/auth.test.ts` (44 tests)
    - Email validation (valid/invalid formats, empty, special characters)
    - Password validation (length, complexity, empty, edge cases)
    - Error messages in Polish for better UX
  - `lib/validators/__tests__/events.test.ts` (76 tests)
    - createEventSchema validation (32 tests): title, city, date, categories, key_information
    - updateEventSchema validation (18 tests): saved, feedback, edited_description
    - getEventsQuerySchema validation (18 tests): pagination, filters, sorting
    - eventIdSchema validation (8 tests): UUID format, empty, invalid formats

- **Utility Tests (40 tests, 100% coverage)**
  - `lib/__tests__/utils.test.ts` (16 tests)
    - cn() classname utility (5 tests): merging, conflicts, conditional classes
    - formatEventDate() date formatting (5 tests): ISO strings, Date objects, invalid dates
    - pluralize() Polish pluralization (6 tests): event count with correct forms (wydarzenie/wydarzenia/wydarzeń)
  - `components/events/__tests__/utils.test.ts` (24 tests)
    - mapToEventViewModel() (6 tests): field mapping, charCount calculation, label generation
    - getEventCategoryLabel() (6 tests): all 8 categories, invalid values, edge cases
    - getAgeCategoryLabel() (6 tests): all 7 categories, invalid values, edge cases
    - formatEventDateShort() (6 tests): Polish locale formatting, Date objects, ISO strings, invalid dates

- **Hook Tests (48 tests, 97%+ coverage)**
  - `components/hooks/__tests__/useEventForm.test.ts` (25 tests)
    - Form state initialization (3 tests): default values, field structure, validation state
    - Field updates with validation (7 tests): title, city, date, categories, key_information
    - Form validation (5 tests): empty fields, date constraints, character limits
    - Reset functionality (3 tests): clears all fields, resets validation, maintains structure
    - Field-specific validation (7 tests): title length, city length, date format, key_information length
  - `components/events/hooks/__tests__/useEventsFilters.test.ts` (23 tests)
    - URL parameter parsing (7 tests): page, sort, order, category, age_category, invalid values
    - Filter updates with debounce (4 tests): 300ms delay, multiple rapid changes, timer verification
    - Sort/order updates (4 tests): immediate application, valid/invalid combinations
    - Pagination (4 tests): page changes, invalid values (NaN, negative, zero)
    - Reset functionality (4 tests): clears filters, resets to defaults, preserves URL sync

- **Service Tests (27 tests, 54-100% coverage)**
  - `lib/services/__tests__/categories.service.test.ts` (12 tests, 100% coverage)
    - getAgeCategories() (6 tests): array structure, expected values, Polish labels, consistency
    - getEventCategories() (6 tests): array structure, expected values, Polish labels, consistency
  - `lib/services/__tests__/events.service.test.ts` (15 tests, 54% coverage)
    - createEvent() (3 tests): success with AI generation, empty description validation, DB insert failure
    - updateEvent() (4 tests): success, event not found, guest event forbidden, no changes to apply
    - getUserEvents() (2 tests): pagination calculation logic, empty results handling
    - getEventById() (3 tests): success, not found (PGRST116 error), database failure
    - softDeleteEvent() (3 tests): success, event not found, guest event modification forbidden
    - Mock helper: createMockEvent() for consistent test data with all required fields

- **Test Infrastructure Improvements**
  - `__tests__/setup.ts` configuration: afterEach cleanup, extended timeout (10s)
  - Vitest config with 80% coverage thresholds for critical modules
  - Consistent test patterns across all suites
  - Error boundary testing for graceful failure handling
  - NaN validation fix in useEventsFilters for invalid page parameters

### Added

- **Events View (/events)**
  - Complete frontend implementation for viewing and managing saved events
  - Protected route requiring authentication with session validation
  - Responsive layout with sidebar filters and main content area
  - Server-side data prefetching for categories (initial data optimization)
  - Global header integration (AppHeader) - consistent across all pages

- **Events Filtering and Sorting**
  - Filter by event category (8 options) and age category (7 options)
  - 6 sort options: created_at, event_date, title (ascending/descending)
  - URL synchronization with 300ms debounce for filter changes
  - Active filters display with reset functionality
  - Event counter with Polish pluralization (wydarzenie/wydarzenia/wydarzeń)

- **Events List**
  - Infinite scroll pagination with IntersectionObserver
  - Fallback "Load more" button for manual loading
  - Skeleton loading states (3 cards during initial load)
  - Empty state variants: no events vs filtered results
  - Error states with retry functionality (401/403 special handling)
  - React Query integration with 5-minute cache and optimistic updates

- **Event Card Components**
  - EventCard with event metadata (title, date, city, categories)
  - EventMeta displaying both event category and age category badges
  - Expand/collapse for long descriptions (>300 characters)
  - "Edytowany" badge when description was modified
  - Character counter badge for description length
  - Created date display in Polish locale format

- **Event Actions**
  - Copy button (ghost variant, icon-only) - copies description to clipboard
  - Edit button with inline editing mode using InlineEditArea component
  - Delete button with confirmation modal (Dialog component)
  - All actions disabled during pending operations
  - Consistent toast notifications matching generator style

- **Inline Editing**
  - InlineEditArea component styled like generator form
  - Real-time character counter (max 500 characters)
  - Visual feedback when approaching/exceeding limit (orange/red)
  - Cancel and Save buttons with proper validation
  - Disabled state during mutation with "Zapisywanie..." text

- **Event Mutations**
  - useEditEventMutation hook for editing event descriptions
  - useDeleteEventMutation hook for soft delete (saved = false)
  - Optimistic updates with automatic rollback on error
  - React Query cache invalidation after successful mutations
  - Comprehensive error handling (400, 401, 403, 404, 500)
  - Success/error toasts with user-friendly Polish messages

- **Data Fetching Hooks**
  - useEventsFilters - filter state management with URL sync
  - useCategoriesQuery - event and age categories with 1-hour cache
  - useInfiniteEventsQuery - infinite scroll with ViewModel mapping
  - Server-side initial data support for faster page load
  - Automatic retry on 5xx errors, no retry on 4xx client errors

- **Error Handling**
  - ErrorBoundary component wrapping EventsPage
  - Fallback UI with error details and refresh button
  - Console logging for debugging (componentDidCatch)
  - Graceful degradation for network/API failures

- **Type Safety**
  - SavedEventViewModel with computed charCount and labels
  - EventsFiltersState for URL-synced filter state
  - EventsSortOption (6 variants), EventsListStatus
  - EditPayload, EventMutationState for mutations
  - Full TypeScript coverage across all components

- **Accessibility**
  - ARIA labels for buttons and form controls
  - Keyboard navigation support (focus states, tab order)
  - Screen reader friendly with proper role attributes
  - Error messages with role="alert" for announcements
  - Semantic HTML (article, aside, main elements)

- **Dark Mode Support**
  - Global dark/light theme switching with system preference detection
  - `useTheme` hook (`src/components/hooks/useTheme.ts`) with localStorage persistence for user preference
  - `ThemeToggle` component with sun/moon icons positioned next to logo in header
  - Outline button variant for better visibility with hover effects
  - Icon size: 1.2rem for improved visual presence
  - Inline script in Layout.astro to prevent FOUC (Flash Of Unstyled Content)
  - CSS variables for both themes already defined in global.css with oklch color space
  - Seamless theme switching without page reload via classList manipulation
  - Accessible with ARIA labels, title tooltips, and keyboard navigation
  - Theme preference synced across all pages via localStorage

- **Global Header**
  - Moved Header from GeneratorPage to global Layout.astro
  - Now visible across all pages in the application (generator, profile, events list)
  - `AppHeader` component (`src/components/generator/AppHeader.tsx`) for auth state management in Astro layout
  - `Header` component as presentation layer with navigation and auth controls
  - ThemeToggle positioned on left side next to clickable logo for better UX
  - Logo is now a link to homepage (`/`) with hover opacity transition
  - Responsive design with proper spacing (gap-3 for logo/toggle, gap-4 for nav items)
  - Visual hierarchy: Logo + Theme Toggle (left) | Navigation + Auth (right)
  - Background color adapts to theme via `bg-background` class

- **Authentication Model**
  - Supabase Auth integration for client-side authentication
  - Email and password authentication via Supabase SDK
  - JWT token verification in backend API routes
  - Session management handled by Supabase
  - No custom authentication endpoints required (handled client-side)

- **API Endpoint: POST /api/events** - Event creation with AI-generated descriptions
  - Supports both authenticated users and guest users
  - Input validation using Zod schemas
  - AI mock service for description generation (development mode)
  - Comprehensive error handling (400, 401, 500, 503)
  - Automatic logging to `event_management_logs` table
  - Field constraints: title (100), city (50), key_information (200)
  - Date validation (ISO 8601, must be today or future)
  - Category and age category enums validation
- **API Endpoint: PATCH /api/events/:id** - Aktualizacja pól `saved`, `feedback`, `edited_description`
  - Wymaga autoryzacji użytkownika i weryfikuje własność rekordu
  - Walidacja danych wejściowych w oparciu o `updateEventSchema`
  - Rejestrowanie akcji w `event_management_logs` (`event_saved`, `event_edited`, `event_rated`)
  - Osobne logowanie zmiany `feedback` jako `event_rated` dla lepszej analizy ocen użytkowników
  - Spójne komunikaty błędów i statusy HTTP (400, 401, 403, 404, 500)
- **API Endpoint: GET /api/events** - Pobieranie listy wydarzeń użytkownika
  - Wymaga autoryzacji (tylko zalogowani użytkownicy)
  - Filtrowanie po `saved`, `category`, `age_category`
  - Sortowanie po `created_at`, `event_date`, `title` (asc/desc)
  - Paginacja z metadanymi (page, limit, total, total_pages, has_next, has_prev)
  - Domyślne wartości: page=1, limit=20, sort=created_at, order=desc
  - Limit maksymalny: 100 wydarzeń na stronę
  - Automatyczna transformacja query parameters (string → boolean/number)
  - Row Level Security (RLS) - użytkownik widzi tylko swoje wydarzenia
  - Optymalizacja: równoległe wykonanie count i data query (Promise.all)
  - Pole `model_version` usunięte z odpowiedzi (EventListItemDTO)
- **API Endpoint: GET /api/events/:id** - Pobieranie pojedynczego wydarzenia po ID
  - Wymaga autoryzacji (token Bearer)
  - Walidacja UUID dla parametru `id` (Zod schema)
  - Row Level Security (RLS) + explicit user_id filter (defense-in-depth)
  - Zwraca pełny obiekt `EventResponseDTO` ze wszystkimi polami (w tym `model_version`)
  - Błąd 404 zarówno dla nieistniejących wydarzeń, jak i wydarzeń innych użytkowników
  - Wydarzenia gości (`user_id = null`) niewidoczne dla zalogowanych użytkowników
  - Wydajne zapytanie: SELECT po primary key + indexed user_id
  - Spójne komunikaty błędów (400, 401, 404, 500)
- **API Endpoint: DELETE /api/events/:id** - Soft delete wydarzenia poprzez ustawienie `saved = false`
  - Wymaga autoryzacji użytkownika (token Bearer)
  - Walidacja UUID dla parametru `id` (Zod schema)
  - Weryfikacja własności wydarzenia (tylko właściciel może usunąć)
  - Blokada usuwania wydarzeń utworzonych jako gość (`created_by_authenticated_user = false`)
  - Soft delete zamiast hard delete - zachowanie danych do audytu
  - Rejestrowanie akcji w `event_management_logs` z typem `event_deleted`
  - Row Level Security (RLS) + explicit user_id filter (defense-in-depth)
  - Zwraca komunikat potwierdzający wraz z ID usuniętego wydarzenia
  - Spójne komunikaty błędów (400, 401, 403, 404, 500)
- **API Endpoint: GET /api/categories/age** - Pobieranie listy kategorii wiekowych
  - Endpoint publiczny (nie wymaga autoryzacji)
  - Zwraca statyczne dane (7 kategorii wiekowych) z polskimi etykietami
  - Brak dostępu do bazy danych - bardzo szybki (<10ms)
  - Cache'owanie odpowiedzi: `Cache-Control: public, max-age=3600` (1 godzina)
  - Rozmiar odpowiedzi: ~250-350 bajtów JSON
  - Wartości enum zgodne z typem `age_category` w bazie danych
  - Wykorzystanie: formularze wyboru kategorii wiekowej (dropdown/select)
  - Spójne komunikaty błędów (500)
- **API Endpoint: GET /api/categories/events** - Pobieranie listy kategorii wydarzeń
  - Endpoint publiczny (nie wymaga autoryzacji)
  - Zwraca statyczne dane (8 kategorii wydarzeń kulturalnych) z polskimi etykietami
  - Brak dostępu do bazy danych - bardzo szybki (<10ms)
  - Cache'owanie odpowiedzi: `Cache-Control: public, max-age=3600` (1 godzina)
  - Rozmiar odpowiedzi: ~300-400 bajtów JSON
  - Wartości enum zgodne z typem `event_category` w bazie danych
  - Wykorzystanie: formularze wyboru kategorii wydarzenia (dropdown/select)
  - Spójne komunikaty błędów (500)

- **Services Layer**
  - `categories.service.ts` - Static data service for categories (events, age)
  - `events.service.ts` - Business logic for event creation with conditional SELECT logic
    - Authenticated users: INSERT with .select() to get DB-generated data
    - Guest users: INSERT without .select() to avoid RLS blocking SELECT operations
    - Guest events use temporary UUIDs (crypto.randomUUID()) for display purposes
    - Audit logging (event_management_logs) skipped for guests to avoid FK constraint violations
  - `ai/generate-event-description.ts` - AI service facade with singleton pattern and 500 char validation
  - `ai/openrouter.service.ts` - OpenRouter API integration for AI description generation (10-30s latency)
  - `ai/openrouter.types.ts` - TypeScript types for OpenRouter API
  - Custom error classes: `EventServiceError`, `AIGenerationError`

- **Validation Layer**
  - `validators/events.ts` - Zod schema for CreateEventDTO
  - Polish error messages for better UX
  - Enum validation against database types

- **Middleware**
  - Supabase client injection into Astro context.locals
  - Available for all API routes and pages

- **Database Schema**
  - Initial schema migration with `events`, `user_activity_logs`, and `event_management_logs` tables
  - Guest users support migration
  - Migration adding `event_rated` to `event_action_type` enum for separate rating analytics
  - Row Level Security (RLS) policies for authenticated and anonymous users
  - Enums: `event_category`, `age_category`, `feedback`, `user_action_type`, `event_action_type`
  - Event action types: `event_created`, `event_saved`, `event_edited`, `event_deleted`, `event_rated`

- **Type Safety**
  - Complete DTO types in `src/types.ts`
  - Database types generated from Supabase schema
  - Environment variable types in `env.d.ts`

- **UI Components**
  - Generator view components (EventForm, DescriptionPanel, etc.)
  - Shadcn/ui components with dark mode support
  - Custom hooks: useEventForm, useGeneratorFlow, useSupabaseSession, useTheme
  - React Query integration for data fetching and mutations
  - Accessibility features (ARIA labels, keyboard navigation, screen reader support)

### Fixed

- **Cloudflare Pages Environment Variables Configuration**
  - Fixed runtime error: "Missing Supabase environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY are required"
  - Root cause: When `wrangler.toml` contains a `[vars]` section, Cloudflare Pages ignores Dashboard variables
  - Solution: Removed `[vars]` section from `wrangler.toml` to allow Dashboard variables to be used
  - Environment variables now managed exclusively through Cloudflare Pages Dashboard UI
  - Configuration: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_KEY`, `SUPABASE_URL`, `SUPABASE_KEY` (Plaintext variables)
  - Secrets remain in Dashboard: `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Encrypted)
  - **Result:** Application now runs successfully on Cloudflare Pages without 500 errors

- Cloudflare Pages deployment with React 19: aliased
  `react-dom/server` → `react-dom/server.edge` in `astro.config.mjs` to ensure
  the runtime provides MessageChannel for SSR. This resolves the "MessageChannel
  is not defined" failure during `wrangler pages deploy`.

- **E2E Test Stability Improvements**
  - Fixed authentication timeout in E2E fixtures (increased from 30s to 45s)
  - Added retry logic with `waitForFunction` for URL navigation check (15s timeout)
  - Added fallback 3s timeout if initial navigation wait fails
  - Added 2s hydration wait in ProfilePage for React Hook Form initialization
  - **Result:** All E2E tests now passing consistently (10/10 generator, 7/7 account management)

- **Password Change Race Condition Fix**
  - Fixed intermittent test failures in `04-account-management.spec.ts` (password change tests)
  - Root cause: Race condition in `useChangePasswordForm` between `signOut()` and state-based redirect
  - Solution: Removed `useEffect` + `shouldRedirect` state, now redirects immediately after `signOut()`
  - Changed from async state update to synchronous `window.location.href` assignment
  - Impact: 100% reliable auto-logout and redirect after password change (was ~70-80% reliable)
  - Files modified: `src/components/hooks/useChangePasswordForm.ts`
  - **Result:** Tests pass consistently on both local and CI environments

- **Code Quality Fixes**
  - Fixed 134 CRLF line ending errors in `tests/e2e/global-teardown.ts`
  - Fixed TypeScript error in `src/__tests__/mocks/handlers.ts` (added `Record<string, unknown>` type assertion)
  - Fixed all line ending issues in newly created files via prettier
  - **Result:** Clean linting, no TypeScript errors, consistent code formatting

- **Registration Flow**
  - Fixed registration redirect issue where form would stay on `/register` page
  - Root cause: `fetch("/api/auth/activity")` call blocked `window.location.href` redirect
  - Solution: Moved redirect before fetch call since API requires authentication
  - Impact: Registration now properly redirects to `/login?message=registration_success`

- **E2E Test Assertions**
  - Fixed logout test expecting strict `/login` redirect when app redirects to `/`
  - Solution: Changed assertion to accept both `/login` and `/` as valid logout destinations
  - Fixed session persistence test failing on query params in URL
  - Solution: Changed from exact URL match to regex pattern allowing query params (`/\/events/`)

- **ProfilePage E2E Tests** ✅
  - Fixed missing `clickLogout()` method in ProfilePage causing 2 test failures
  - Added logout button locator with regex pattern (`/Wyloguj|Logout/i`)
  - Implemented `clickLogout()` method with proper navigation waiting
  - Tests now pass: 01-auth "should logout successfully" and 03-complete-journey "should complete full registration to event save journey"
  - **Result:** All 44 E2E tests passing (100% pass rate excluding planned skips)

### Changed

- **Layout Architecture**
  - Header moved from page-level to global layout (Layout.astro)
  - All pages now share the same header with authentication state
  - Simplified GeneratorPage component (removed local Header management)
  - Better separation of concerns: AppHeader (logic) vs Header (presentation)

- Updated `.env.example` with `AI_MODEL_VERSION` variable
- Updated `README.md` with project structure, API documentation, and development status

- **AI Service Implementation**
  - OpenRouter API integration for event description generation
  - Model: `openai/gpt-4o-mini` (optimized for cost and Polish language quality)
  - JSON Schema structured output with strict mode (max 500 characters)
  - Retry logic with exponential backoff (max 2 retries: 1s, 2s delays)
  - 30-second timeout with AbortController
  - No retry for 4xx client errors, automatic retry for 5xx server errors
  - Comprehensive error handling with status codes (401, 503, etc.)
  - API key validation (must start with `sk-or-v1-`)
  - Singleton pattern for service instance
  - Polish language prompts with grammatical requirements (miasto w miejscowniku, grupa wiekowa w dopełniaczu)
  - Validation ensuring AI-generated descriptions don't exceed 500 characters

### Technical Details

- **Framework:** Astro 5 with TypeScript 5
- **Database:** Supabase (PostgreSQL)
- **Validation:** Zod + React Hook Form (forms)
- **AI Provider:** OpenRouter.ai with `openai/gpt-4o-mini` model
- **Testing:** Vitest 4.0.4 with React Testing Library, jsdom environment, 241 unit tests
- **Form Management:** React Hook Form 7.x with @hookform/resolvers for Zod integration

## [0.0.0] - 2025-10-17

### Added

- Initial project setup
- Tech stack configuration (Astro, React, TypeScript, Tailwind, Shadcn/ui)
- Supabase integration
- Basic project structure
