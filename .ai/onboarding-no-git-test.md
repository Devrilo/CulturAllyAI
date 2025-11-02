# Project Onboarding: CulturAllyAI

> **Note:** This onboarding document was created as a **simulation exercise** to test the methodology of exploring a project repository from scratch. It was generated **without access to git history** and **without referencing the existing `onboarding.md` file**. The document demonstrates how a comprehensive onboarding guide can be built purely through systematic exploration of the codebase, documentation, and project structure using file reading, directory listing, and search tools.

## Welcome

Welcome to **CulturAllyAI**! This is a web application designed to generate concise, engaging, and factual descriptions of cultural events using Large Language Models (LLMs) based solely on user-provided input. The application enables organizers, cultural institutions, and volunteers to quickly obtain well-structured event descriptions without extensive manual editing.

**Current Status:** MVP Complete (v0.0.1) - Production-ready with comprehensive testing infrastructure and CI/CD pipeline deployed on Cloudflare Pages.

**License:** MIT License - Open source project.

## Project Overview & Structure

CulturAllyAI is a full-stack application built with modern web technologies, following a server-side rendering (SSR) architecture with React islands for interactivity. The project implements:

- **Frontend:** Astro 5 pages with React 19 components for dynamic features
- **Backend:** Astro API routes with Supabase PostgreSQL database
- **AI Integration:** OpenRouter.ai with GPT-4o-mini for description generation
- **Authentication:** Supabase Auth with JWT-based session management
- **Testing:** Vitest (241 unit tests, 79% coverage) and Playwright (44 E2E tests, 100% pass rate)
- **CI/CD:** GitHub Actions with automated testing and Cloudflare Pages deployment

The application supports both authenticated users and guest users, with Row Level Security (RLS) policies ensuring data isolation.

### Project Directory Structure

```
CulturAllyAI/
├── .github/
│   ├── workflows/           # CI/CD pipelines (pull-request.yml, master.yml)
│   └── copilot-instructions.md
├── src/
│   ├── components/          # UI components (Astro & React)
│   │   ├── auth/           # Authentication (Login, Register, Password forms)
│   │   ├── generator/      # Event generator UI (forms, previews, actions)
│   │   ├── events/         # Events list management with CRUD operations
│   │   ├── settings/       # Account management (password, deletion)
│   │   ├── hooks/          # Custom React hooks (business logic layer)
│   │   └── ui/             # Shadcn/ui reusable components
│   ├── pages/              # Astro pages and API routes
│   │   ├── api/           # RESTful API endpoints
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── categories/ # Category data endpoints
│   │   │   └── events/    # Event CRUD endpoints
│   │   ├── index.astro    # Homepage
│   │   ├── login.astro    # Login page
│   │   ├── register.astro # Registration page
│   │   ├── profile.astro  # Profile/settings page
│   │   └── events.astro   # Events list page
│   ├── layouts/            # Astro layouts (Layout.astro with global header)
│   ├── lib/                # Services and utilities
│   │   ├── services/      # Business logic layer
│   │   │   ├── ai/        # AI generation service (OpenRouter)
│   │   │   ├── categories.service.ts
│   │   │   └── events.service.ts
│   │   ├── validators/    # Zod validation schemas
│   │   ├── mappers/       # DTO-to-ViewModel transformations
│   │   └── utils/         # Utility functions
│   ├── middleware/         # Astro middleware (Supabase client injection)
│   ├── db/                 # Database clients and types
│   ├── types.ts           # Shared TypeScript types (300+ LOC type hub)
│   └── styles/            # Global CSS with dark mode variables
├── tests/
│   └── e2e/               # Playwright E2E tests
│       ├── pages/         # Page Object Model implementations
│       ├── fixtures.ts    # Test fixtures (authenticated state)
│       └── *.spec.ts      # Test suites (44 passing tests)
├── supabase/
│   └── migrations/        # Database migrations (4 files)
├── docs/                  # Project documentation
│   ├── testing-setup.md
│   ├── ci-cd-setup.md
│   ├── cloudflare-deployment.md
│   └── manual-tests/      # API endpoint test plans
├── public/                # Static assets
└── Configuration files (astro.config.mjs, tsconfig.json, etc.)
```

## Core Modules

### `src/components/generator`

- **Role:** Primary event creation and AI description generation interface
- **Key Files/Areas:**
  - `GeneratorPage.tsx` (36 LOC) - Container component with business logic orchestration using Container/Presenter pattern
  - `GeneratorPageView.tsx` (88 LOC) - Presentational component handling UI rendering
  - `EventForm.tsx` - Event input form with validation and character limits
  - `DescriptionPanel.tsx` - AI-generated description display
  - `ActionButtons.tsx` - Save, copy, and rating action buttons
  - `AppHeader.tsx` - Global header with authentication state
  - `ThemeToggle.tsx` - Dark/light mode toggle
  - `Header.tsx` - Header presentation component
- **Recent Focus:** Major architectural refactoring from monolithic 238 LOC component to Container/Presenter pattern (85% LOC reduction), dark mode integration, OpenRouter AI service integration
- **Module Relationships:** Depends on `src/components/hooks` for business logic, consumes `src/lib/services` for API interactions, integrates React Query for state management

### `src/components/hooks`

- **Role:** Custom React hooks providing business logic abstraction and state management
- **Key Files/Areas:**
  - `useGeneratorFlow.ts` (60 LOC) - Facade pattern hook for simplified integration
  - `useGenerator.ts` (160 LOC) - Composite business logic orchestration
  - `useEventGeneration.ts` (110 LOC) - AI generation with timeout handling
  - `useEventSave.ts` (50 LOC) - Event save mutation
  - `useEventRating.ts` (50 LOC) - Event rating mutation
  - `useClipboard.ts` (40 LOC) - Clipboard operations
  - `useEventForm.ts` - Form state and validation
  - `useChangePasswordForm.ts` (106 LOC) - React Hook Form with Zod validation
  - `useRegisterForm.ts` (102 LOC) - Registration form logic
  - `useSupabaseSession.ts` - Authentication state management
  - `useTheme.ts` - Dark mode theme management
- **Recent Focus:** Phase 1 refactoring splitting monolithic hook into 4 specialized hooks (74% LOC reduction), React Hook Form migration eliminating duplicate validation logic (42-50% reduction per form)
- **Module Relationships:** Consumed by generator, auth, and events components. Interfaces with services layer and Supabase client

### `src/components/events`

- **Role:** Event list management with infinite scroll, filtering, and CRUD operations
- **Key Files/Areas:**
  - `EventsPage.tsx` - Main events list container
  - `EventsList.tsx` - Infinite scroll event list
  - `EventCard.tsx` - Individual event card with metadata
  - `EventMeta.tsx` - Event category and age category badges
  - `InlineEditArea.tsx` - Inline description editing
  - `DeleteAction.tsx` - Soft delete with confirmation
  - `CopyButton.tsx` - Copy description to clipboard
  - `FiltersBar.tsx` - Category and age filters
  - `SortSelect.tsx` - Sort options
  - `hooks/useEventsFilters.ts` - URL-synced filter state (300ms debounce)
  - `hooks/useInfiniteEventsQuery.ts` - React Query infinite scroll
- **Recent Focus:** Complete Events View implementation with infinite scroll pagination, URL-synced filters, optimistic updates, soft delete functionality
- **Module Relationships:** Uses React Query for data fetching, consumes events service API, implements IntersectionObserver for infinite scroll

### `src/lib/services`

- **Role:** Business logic layer encapsulating backend interactions
- **Key Files/Areas:**
  - `events.service.ts` - Event CRUD operations with custom error classes
    - Implements conditional SELECT logic for guest vs authenticated users
    - Guest users: INSERT without `.select()` to avoid RLS blocking
    - Authenticated users: INSERT with `.select()` to get DB-generated data
  - `ai/generate-event-description.ts` - AI service facade with singleton pattern
  - `ai/openrouter.service.ts` - OpenRouter API integration with retry logic and 30s timeout
  - `ai/openrouter.types.ts` - TypeScript types for AI service
  - `categories.service.ts` - Static category data
  - `__tests__/` - Service layer unit tests (15 tests, 79% coverage for events service)
- **Recent Focus:** Comprehensive service layer with custom error handling, OpenRouter integration, conditional SELECT logic solving guest user RLS constraints, audit logging
- **Module Relationships:** Consumed by API routes, depends on Supabase client from middleware, uses types from `src/types.ts`

### `src/pages/api`

- **Role:** RESTful API endpoints implementing thin route pattern
- **Key Files/Areas:**
  - `events/index.ts` - POST for event creation
  - `events/[id].ts` - GET, PATCH, DELETE for individual events
  - `categories/events.ts` - GET event categories
  - `categories/age.ts` - GET age categories
  - `auth/activity.ts` - POST for activity logging
  - `auth/delete-account.ts` - POST for account deletion
- **Recent Focus:** Complete CRUD implementation with Zod validation at boundary, business logic delegation to services, comprehensive error handling
- **Module Relationships:** Consumes Supabase client from middleware context.locals, delegates to services, validates with Zod schemas

### `src/middleware`

- **Role:** Astro middleware handling request/response processing and dependency injection
- **Key Files/Areas:**
  - `index.ts` - Supabase client creation, cookie handling, environment variable configuration
- **Recent Focus:** Environment variable priority logic (`import.meta.env || runtime.env`) ensuring compatibility across development (Vite), testing (dotenv), and production (Cloudflare runtime)
- **Module Relationships:** Foundation for all modules - creates Supabase client consumed by services and API routes, injects OpenRouter API key, establishes environment configuration

### `tests/e2e`

- **Role:** End-to-end testing infrastructure using Playwright
- **Key Files/Areas:**
  - `01-auth.spec.ts` (9 tests) - Authentication flows
  - `02-generator.spec.ts` (10 tests) - Event generation with AI
  - `03-complete-journey.spec.ts` (5 tests) - Full user journeys
  - `04-account-management.spec.ts` (7/9 tests) - Password change, account deletion
  - `05-events.spec.ts` (9/11 tests) - Events list management
  - `example.spec.ts` (4 tests) - Smoke tests
  - `pages/` - Page Object Model (LoginPage, RegisterPage, GeneratorPage, EventsPage, ProfilePage)
  - `fixtures.ts` - Authenticated state fixture with React hydration handling
  - `global-teardown.ts` - Database cleanup after tests
- **Recent Focus:** 44 passing tests (100% pass rate excluding 4 planned skips), race condition fixes in password change flow, environment variable loading fixes, sequential execution pattern preventing JWT conflicts
- **Module Relationships:** Tests all modules end-to-end, validates middleware environment configuration, exercises services, ensures UI consistency

### `src/db`

- **Role:** Database client configuration and type definitions
- **Key Files/Areas:**
  - `supabase.client.ts` - Browser-side Supabase client using `@supabase/ssr`
  - `supabase.admin.ts` - Service role client for admin operations
  - `database.types.ts` - Generated types from Supabase schema
- **Recent Focus:** Foundation established with `@supabase/ssr` package for proper SSR cookie handling
- **Module Relationships:** Browser client consumed by hooks for authentication, server-side client created in middleware for API routes

### Configuration Files

- **Role:** Project-level configuration orchestrating architecture
- **Key Files/Areas:**
  - `astro.config.mjs` - Astro SSR setup, Cloudflare adapter, React 19 SSR compatibility (`react-dom/server.edge` aliasing)
  - `playwright.config.ts` - E2E test configuration with `.env.test` loading, 90s timeout, sequential execution
  - `vitest.config.ts` - Unit test configuration with jsdom, 80% coverage thresholds
  - `tsconfig.json` - TypeScript configuration with path aliases
  - `package.json` - Dependencies and scripts
  - `src/types.ts` (300+ LOC) - Central type hub with DTOs, enums, view models
  - `src/env.d.ts` - Environment variable type declarations
- **Recent Focus:** Cloudflare Pages deployment configuration, React 19 compatibility fixes, testing infrastructure setup
- **Module Relationships:** Defines how all modules interact - Playwright configures E2E tests, types.ts provides contracts, astro.config orchestrates SSR

## Key Contributors

Based on the project structure and documentation, this appears to be developed by:

- **Marcin Szwajgier (Devrilo)** - Primary developer based on GitHub repository ownership (Devrilo/CulturAllyAI)

The project demonstrates comprehensive full-stack development expertise across:
- Frontend architecture (Astro, React, TypeScript)
- Backend services (Supabase, API design)
- Testing infrastructure (Vitest, Playwright)
- CI/CD pipelines (GitHub Actions)
- Cloud deployment (Cloudflare Pages)

## Overall Takeaways & Recent Focus

1. **Production-Ready MVP:** Complete feature set with 241 passing unit tests (79% coverage) and 44 passing E2E tests (100% pass rate excluding 4 intentional skips). All critical user flows validated end-to-end.

2. **Comprehensive Testing Infrastructure:** Dual testing approach with Vitest for unit tests and Playwright for E2E tests. Page Object Model pattern for maintainable E2E tests. Test fixtures for authenticated state. Global database cleanup after test runs.

3. **Modern Architecture Patterns:** Container/Presenter pattern in GeneratorPage (85% LOC reduction), Facade pattern in hooks (74% reduction), React Hook Form integration (42-50% reduction per form). Focus on separation of concerns and testability.

4. **Multi-Environment Configuration:** Three-tier environment variable system supporting development (Vite), testing (dotenv), and production (Cloudflare). Middleware implements priority chain: `import.meta.env || runtime.env`.

5. **AI Integration:** OpenRouter API with GPT-4o-mini model for description generation. Retry logic with exponential backoff, 30s timeout handling, validation ensuring descriptions don't exceed 500 characters.

6. **Security & Data Isolation:** Row Level Security (RLS) policies on all tables. Authenticated users can only access their own data. Service role key bypasses RLS for admin operations and test cleanup. Audit logging for compliance.

7. **Guest User Support:** Dual-path logic in event creation - guests use temporary UUIDs without `.select()` to avoid RLS blocking SELECT operations. Authenticated users get DB-generated IDs with audit logging.

8. **CI/CD Pipeline:** GitHub Actions with pull request workflow (lint → tests → PR comment) and production deployment workflow (lint → test → build → deploy). Automated testing on every PR with encrypted secrets.

## Potential Complexity/Areas to Note

- **Middleware Environment Variables:** The `src/middleware/index.ts` uses specific priority order (`import.meta.env || runtime.env`) for environment variables. This pattern is critical for multi-environment compatibility. Reversing the order breaks test environment functionality.

- **Guest vs Authenticated Event Creation:** The `events.service.ts` implements conditional SELECT logic creating two execution paths:
  - **Authenticated:** INSERT with `.select()` to get DB-generated ID
  - **Guest:** INSERT without `.select()` (RLS blocks SELECT for anon role), uses `crypto.randomUUID()` for temporary display ID
  
  This dual-path logic exists because Supabase RLS policies prevent anonymous users from SELECT operations while allowing INSERT. Solution is documented in code comments.

- **React Query + Optimistic Updates:** Events View uses optimistic updates for mutations (edit, delete) with automatic rollback on error. Understanding React Query's cache invalidation patterns is essential for data consistency.

- **AI Generation Timing:** OpenRouter typically takes 10-30 seconds but can timeout at 90 seconds. E2E tests require extended timeouts (90-360s for multiple generations). Generated descriptions are validated to not exceed 500 characters.

- **E2E Test Stability Patterns:** Several critical patterns emerged from test development:
  - Radix UI comboboxes need 1s wait after click (React hydration timing)
  - React `client:load` components require 2-4s wait for full hydration
  - Category values must use exact capitalized names from database ENUMs
  - Shadcn/ui checkboxes need `{ force: true }` to bypass covering elements
  - EventsPage requires `waitForPageReady()` to handle React Query loading states
  - Sequential test execution (1 worker) prevents JWT session conflicts

- **Cloudflare Pages Configuration:** Environment variables must be managed exclusively through Dashboard UI (not wrangler.toml `[vars]` section). React 19 SSR requires `react-dom/server.edge` aliasing to avoid "MessageChannel is not defined" errors.

- **Type System Complexity:** `src/types.ts` contains 300+ lines defining DTOs (backend contracts), view models (UI representations), form types (validation schemas), and enums. Understanding the separation between these type categories is crucial for maintaining type safety.

- **Custom Error Classes:** Services layer implements custom error classes (`EventServiceError`, `AIGenerationError`) with status codes for precise error handling. API routes map these to HTTP responses.

## Questions for the Team

Based on exploration of the project structure and documentation:

1. **Environment Configuration Strategy:** The middleware implements a specific environment variable priority chain. Are there documented runbooks for debugging environment issues across development, testing, and production?

2. **Guest Event Data Retention:** Events created by guests use temporary UUIDs and have no audit logging. What is the data retention policy for guest-created events? Are there plans for tracking or migrating guest events when users authenticate?

3. **Test Coverage Goals:** The project has 79% code coverage for unit tests. What are the coverage requirements for new features? Are there specific modules that require higher coverage thresholds?

4. **Refactoring Pattern Adoption:** Major refactoring patterns (Container/Presenter, Facade, React Hook Form) were applied achieving 42-85% LOC reductions. Are these patterns now mandatory for new features? Is there a style guide documenting when to apply each pattern?

5. **AI Cost & Performance Monitoring:** OpenRouter AI integration with GPT-4o-mini has been stable. What is the expected load profile and cost structure for production? Are there rate limiting, cost monitoring, or fallback mechanisms planned?

6. **Authentication Flow Evolution:** The password change flow required multiple iterations to resolve race conditions. Are there similar considerations for other authentication flows (registration, login, account deletion)?

7. **Production Monitoring:** With deployment on Cloudflare Pages, what monitoring and alerting systems are in place? Are there dashboards for tracking API performance, error rates, and user activity?

## Next Steps

### Week 1: Foundation & Setup

1. **Set up Development Environment:**
   - Install Node.js 22.14.0 (see `.nvmrc`)
   - Clone repository and run `npm install`
   - Install Supabase CLI: `npm install -g supabase`
   - Start local Supabase: `supabase start`
   - Apply migrations: `supabase db reset`

2. **Configure Environment Files:**
   - Create `.env` file for local development (see `.env.local.example`)
   - Create `.env.test` file for E2E tests (see `.env.example`)
   - Required variables: `SUPABASE_URL`, `SUPABASE_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_KEY`, `OPENROUTER_API_KEY`
   - For E2E tests also set: `E2E_USERNAME`, `E2E_PASSWORD`, `E2E_USERNAME_ID`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Run the Application:**
   ```bash
   npm run dev  # Start dev server at http://localhost:3000
   ```

4. **Explore Key Files:**
   - Read `README.md` for project overview
   - Study `src/types.ts` for type system (300+ LOC central hub)
   - Review `src/middleware/index.ts` for environment configuration
   - Examine `astro.config.mjs` for SSR and deployment setup

### Week 2: Testing & Architecture

5. **Run Test Suites:**
   ```bash
   npm test                # 241 unit tests
   npm run test:coverage   # Coverage report
   npm run test:e2e:ui     # 44 E2E tests with Playwright UI
   ```

6. **Study Architectural Patterns:**
   - Container/Presenter: `src/components/generator/GeneratorPage.tsx` (36 LOC) vs `GeneratorPageView.tsx` (88 LOC)
   - Facade Pattern: `src/components/hooks/useGeneratorFlow.ts` (60 LOC) splitting into 4 specialized hooks
   - React Hook Form: `src/components/hooks/useChangePasswordForm.ts` (106 LOC) with Zod validation

7. **Trace Full-Stack Flow:**
   - Start: User submits event form
   - Frontend: `GeneratorPage.tsx` → `useGenerator` hook
   - API: `src/pages/api/events/index.ts` (Zod validation)
   - Service: `src/lib/services/events.service.ts` (conditional SELECT logic)
   - AI: `src/lib/services/ai/generate-event-description.ts`
   - Database: Supabase client from middleware

### Week 3: Advanced Topics

8. **Study Multi-Environment Configuration:**
   - Compare `.env.local.example` and `.env.example`
   - Review `docs/cloudflare-deployment.md`
   - Understand middleware environment priority (`import.meta.env || runtime.env`)

9. **Explore Guest vs Authenticated Patterns:**
   - Read `src/lib/services/events.service.ts` `createEvent()` function
   - Understand RLS policy implications
   - Study temporary UUID generation for guests

10. **Review E2E Test Patterns:**
    - Study Page Object Model in `tests/e2e/pages/`
    - Note wait times: 1s for Radix UI, 2-4s for React hydration
    - Review `fixtures.ts` for authenticated state management

## Development Environment Setup

### Prerequisites
- Node.js 22.14.0 (specified in `.nvmrc`)
- npm package manager
- Supabase CLI for local database
- Git for version control

### Installation Steps

1. **Clone and Install:**
   ```bash
   git clone https://github.com/Devrilo/CulturAllyAI.git
   cd CulturAllyAI
   npm install
   ```

2. **Environment Configuration:**
   
   Create **two** environment files:

   **`.env`** (Local Development):
   ```bash
   # Supabase Configuration (Server-side)
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Supabase Configuration (Client-side)
   PUBLIC_SUPABASE_URL=your-supabase-url
   PUBLIC_SUPABASE_KEY=your-supabase-anon-key

   # OpenRouter API Configuration
   OPENROUTER_API_KEY=sk-or-v1-your-api-key
   ```

   **`.env.test`** (E2E Testing):
   ```bash
   # Same as .env plus:
   E2E_USERNAME=test-user@example.com
   E2E_PASSWORD=your-test-password
   E2E_USERNAME_ID=uuid-of-test-user
   ```

3. **Database Setup:**
   ```bash
   supabase start           # Start local Supabase
   supabase db reset        # Apply migrations
   ```

4. **Run Development Server:**
   ```bash
   npm run dev              # http://localhost:3000
   ```

### Available Scripts

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build

**Testing:**
- `npm test` - Run unit tests (241 tests)
- `npm run test:watch` - Watch mode
- `npm run test:ui` - Vitest UI
- `npm run test:coverage` - Coverage report (79%)
- `npm run test:e2e` - E2E tests (44 tests)
- `npm run test:e2e:ui` - Playwright UI mode
- `npm run test:e2e:debug` - Debug E2E tests

**Code Quality:**
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format with Prettier

### Common Issues

- **Supabase connection errors:** Ensure local Supabase is running (`supabase status`). Verify environment variables match output from `supabase start`.

- **E2E test failures:** Tests require `.env.test` file with separate test database credentials. Verify `E2E_USERNAME`, `E2E_PASSWORD`, `E2E_USERNAME_ID` are set. Use `npm run test:e2e:ui` for debugging.

- **"E2E_USERNAME or E2E_PASSWORD not found" warning:** Create `.env.test` in project root with test credentials. This file is loaded by both `playwright.config.ts` and `fixtures.ts`.

- **React 19 hydration warnings:** Wait times (2-4s) are intentional for `client:load` components. See test fixtures for patterns.

- **Environment variables not loading:** Ensure correct file is used - `.env` for `npm run dev`, `.env.test` for `npm run test:e2e`. Playwright automatically loads `.env.test` via dotenv.

## Helpful Resources

### Internal Documentation
- **Testing:** `docs/testing-setup.md` - Complete testing infrastructure guide
- **CI/CD:** `docs/ci-cd-setup.md` - GitHub Actions pipeline setup
- **Deployment:** `docs/cloudflare-deployment.md` - Cloudflare Pages deployment guide
- **Troubleshooting:** `docs/cloudflare-troubleshooting.md` - Common deployment issues
- **Manual Tests:** `docs/manual-tests/*.md` - API endpoint test plans (7 files)
- **Coding Guidelines:** `.github/copilot-instructions.md` - Project coding standards

### External Resources
- **Astro Documentation:** https://docs.astro.build/
- **React Documentation:** https://react.dev/
- **Supabase Documentation:** https://supabase.com/docs
- **Playwright Documentation:** https://playwright.dev/
- **Vitest Documentation:** https://vitest.dev/
- **Cloudflare Pages:** https://developers.cloudflare.com/pages/
- **OpenRouter API:** https://openrouter.ai/docs

### Repository & Communication
- **GitHub Repository:** https://github.com/Devrilo/CulturAllyAI
- **Issue Tracker:** GitHub Issues at repository
- **Project Status:** See `CHANGELOG.md` for detailed version history
- **License:** MIT License (see repository)
