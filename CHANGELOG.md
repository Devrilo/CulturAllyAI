# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
  - Rejestrowanie akcji w `event_management_logs` (`event_saved`, `event_edited`)
  - Spójne komunikaty błędów i statusy HTTP (400, 401, 403, 404, 500)

- **Services Layer**
  - `events.service.ts` - Business logic for event creation
  - `ai/generate-event-description.ts` - AI mock service with 500ms delay simulation
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
  - Row Level Security (RLS) policies for authenticated and anonymous users
  - Enums: `event_category`, `age_category`, `feedback`, `user_action_type`, `event_action_type`

- **Type Safety**
  - Complete DTO types in `src/types.ts`
  - Database types generated from Supabase schema
  - Environment variable types in `env.d.ts`

### Changed

- Updated `.env.example` with `AI_MODEL_VERSION` variable
- Updated `README.md` with project structure, API documentation, and development status

### Technical Details

- **Framework:** Astro 5 with TypeScript 5
- **Database:** Supabase (PostgreSQL)
- **Validation:** Zod
- **AI Provider:** OpenRouter (planned, currently using mock)

## [0.0.0] - 2025-10-17

### Added

- Initial project setup
- Tech stack configuration (Astro, React, TypeScript, Tailwind, Shadcn/ui)
- Supabase integration
- Basic project structure
