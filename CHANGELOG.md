# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Authentication UI Components**
  - Login page (`/login`) with email/password form and error handling
  - Registration page (`/register`) with password strength indicator (5-level)
  - Settings page (`/settings`) with account management options
  - Change Password modal with visual strength indicator
  - Delete Account modal with password confirmation and consent checkbox
  - `AuthPageShell` component for consistent auth page layout
  - `AuthErrorAlert` component mapping Supabase errors to Polish messages
  - `useAuthRedirect` hook for secure redirect parameter handling
  - Custom `Checkbox` component matching shadcn/ui design system
  - Password strength calculation utilities (0-4 score with colors)
  
- **Authentication DTOs and Validators**
  - `loginSchema`, `registerSchema`, `changePasswordSchema`, `deleteAccountSchema` (Zod)
  - `AuthActivityDTO`, `ChangePasswordRequestDTO`, `DeleteAccountRequestDTO` types
  - Client-side form validation with field-level error messages
  - Password requirements: minimum 8 characters, letter + number

- **Authentication Model**
  - Supabase Auth integration for client-side authentication
  - Email and password authentication via Supabase SDK
  - JWT token verification in backend API routes
  - Session management handled by Supabase
  - No custom authentication endpoints required (handled client-side)
  - Auto-login after registration (MVP without email confirmation)

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

- **Frontend - Generator View** (Complete MVP implementation)
  - Main page (`src/pages/index.astro`) - Event description generator interface
  - React Query integration for API state management (1-hour cache for categories)
  - Complete component hierarchy with separation of concerns
  - **Components:**
    - `GeneratorPage.tsx` - Main container with state orchestration and React Query provider
    - `Header.tsx` - Navigation header with auth-aware controls (Moje wydarzenia, Profil, Wyloguj for authenticated; Zaloguj się, Zarejestruj się for guests)
    - `EventForm.tsx` - Form with validation, character counters, and inline error messages
    - `DescriptionPanel.tsx` - Container for generated description and actions
    - `DescriptionPreview.tsx` - Display component for AI-generated descriptions
    - `ActionButtons.tsx` - Generate and Save buttons with loading states
    - `RatingButtons.tsx` - Thumbs up/down rating interface with tooltips
    - `CharacterCounter.tsx` - Reusable character limit indicator with color coding
    - `AuthPromptBanner.tsx` - Guest user prompt to log in for additional features
    - `TimeoutNotice.tsx` - Alert for slow AI generation (>10s threshold)
  - **Custom Hooks:**
    - `useSupabaseSession.ts` - Auth state monitoring with session refresh
    - `useEventForm.ts` - Form state with Zod validation and 300ms debouncing
    - `useGeneratorFlow.ts` - Mutations for generate/save/rate/copy with timeout tracking and AbortController
  - **Features:**
    - Guest and authenticated user support with feature gating
    - Real-time form validation with debounced error messages
    - Character counters with color coding (>90% orange, >100% red)
    - Skeleton loading states for better UX
    - Toast notifications via Sonner
    - Clipboard API integration for copying descriptions
    - 10-second timeout notice for slow AI generation
    - Tooltips on disabled buttons explaining auth requirements
    - Responsive 2-column layout (mobile: stack, desktop: side-by-side)
    - Accessibility: ARIA labels, live regions, keyboard navigation

- **Global Application Features**
  - Dark mode support with system preference detection and localStorage persistence
  - Global header with theme toggle (sun/moon icon)
  - Seamless theme switching without page reload
  - FOUC prevention (Flash of Unstyled Content)
  - Header moved to global layout (`src/layouts/Layout.astro`) for consistency across all pages

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

### Changed

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
