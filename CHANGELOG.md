# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
  - `events.service.ts` - Business logic for event creation
  - `ai/generate-event-description.ts` - AI service facade with singleton pattern
  - `ai/openrouter.service.ts` - OpenRouter API integration for AI description generation
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
- **Validation:** Zod
- **AI Provider:** OpenRouter.ai with `openai/gpt-4o-mini` model

## [0.0.0] - 2025-10-17

### Added

- Initial project setup
- Tech stack configuration (Astro, React, TypeScript, Tailwind, Shadcn/ui)
- Supabase integration
- Basic project structure
