# Project Onboarding: CulturAllyAI

## Welcome

Welcome to the **CulturAllyAI** project! CulturAllyAI is a web application designed to generate concise, engaging, and factual descriptions of cultural events using LLMs based solely on user-provided input. It enables organizers, cultural institutions, and volunteers to quickly obtain well-structured event descriptions without the need for extensive manual editing.

**Project Status:** MVP Complete (v0.0.1) - Production-ready with comprehensive testing infrastructure and CI/CD pipeline.

**License:** MIT License - Open source project.

## Project Overview & Structure

The core functionality revolves around AI-powered event description generation with comprehensive user management and event lifecycle features. The project is organized as a single-page application with SSR capabilities, built with Astro 5, React 19, and TypeScript 5, following a modern full-stack architecture with:

- **Frontend:** Astro pages with React islands for interactivity
- **Backend:** Astro API routes with Supabase PostgreSQL database
- **AI Integration:** OpenRouter.ai with GPT-4o-mini for description generation
- **Authentication:** Supabase Auth with JWT-based session management
- **Testing:** Comprehensive coverage with Vitest (241 unit tests) and Playwright (44 E2E tests)
- **CI/CD:** GitHub Actions with automated testing and Cloudflare Pages deployment

## Core Modules

### `src/components/generator`

- **Role:** Serves as the primary event creation and AI description generation interface, implementing a Container/Presenter pattern where `GeneratorPage.tsx` (36 LOC) handles business logic orchestration while `GeneratorPageView.tsx` (88 LOC) manages presentation. This module underwent a major architectural transformation, reducing code complexity by 85% through separation of concerns and introduction of specialized components.
- **Key Files/Areas:**
  - Container/Presenter Pattern: `GeneratorPage.tsx` (36 LOC, 4 changes), `GeneratorPageView.tsx` (88 LOC)
  - Form Components: `EventForm.tsx`, `DescriptionPanel.tsx`, `ActionButtons.tsx`
  - UI Components: `AppHeader.tsx`, `Header.tsx`, `ThemeToggle.tsx`
- **Top Contributed Files:** `GeneratorPage.tsx`, `GeneratorPageView.tsx`, `EventForm.tsx`
- **Recent Focus:** Major refactoring from monolithic 238 LOC component to Container/Presenter pattern (Oct 30, 2025), FormField abstraction implementation reducing code duplication, dark mode integration (Oct 23), and OpenRouter service integration for AI generation. Core development focused on improving testability and maintainability while preserving functionality.
- **Module Relationships:** Depends on `src/components/hooks` for business logic (`useSupabaseSession`, `useGenerator`), consumes `src/lib/services` for API interactions, and integrates React Query for state management.

### `tests/e2e`

- **Role:** Comprehensive end-to-end testing infrastructure using Playwright covering the entire user journey with 44 passing tests organized into 5 test suites: authentication (9 tests), generator flow (10 tests), complete user journey (5 tests), account management (7/9 tests), and events management (9/11 tests). Achieved 100% pass rate excluding 4 intentional feature skips, demonstrating production-ready stability.
- **Key Files/Areas:**
  - Test Suites: `01-auth.spec.ts` (9 tests), `02-generator.spec.ts` (10 tests), `03-complete-journey.spec.ts` (5 tests), `04-account-management.spec.ts` (7/9 tests), `05-events.spec.ts` (9/11 tests)
  - Page Objects: `pages/LoginPage.ts`, `pages/RegisterPage.ts`, `pages/GeneratorPage.ts`, `pages/EventsPage.ts`, `pages/ProfilePage.ts`
  - Test Infrastructure: `fixtures.ts` (authenticated state management), `global-teardown.ts` (database cleanup)
- **Top Contributed Files:** `02-generator.spec.ts`, `04-account-management.spec.ts`, `05-events.spec.ts`
- **Recent Focus:** Resolution of critical race conditions in password change flow (Nov 2, 2025), environment variable loading fixes for Playwright workers enabling test execution in CI/CD, implementation of comprehensive database cleanup with service role key, and stabilization patterns for React hydration timing (2-4s waits) and Radix UI interactions (1s waits for comboboxes).
- **Module Relationships:** Tests all modules end-to-end, validates `src/middleware` environment configuration, exercises `src/lib/services` business logic, and ensures `src/components` UI consistency. Configuration managed by `playwright.config.ts` (5 changes).

### `src/components/hooks`

- **Role:** Custom React hooks layer providing business logic abstraction and state management, serving as the primary interface between UI components and backend services. Underwent Phase 1 refactoring splitting monolithic 236 LOC hook into 4 specialized hooks achieving 74% code reduction, and React Hook Form migration for authentication components achieving 42-50% LOC reduction per form.
- **Key Files/Areas:**
  - Generator Hooks: `useGeneratorFlow.ts` (facade, 60 LOC), `useGenerator.ts` (composite logic, 160 LOC), `useEventGeneration.ts`, `useEventSave.ts`, `useEventRating.ts`, `useClipboard.ts`
  - Form Hooks: `useEventForm.ts`, `useChangePasswordForm.ts` (5 changes - high activity), `useRegisterForm.ts`
  - Utility Hooks: `useSupabaseSession.ts`, `useAuthRedirect.ts`, `useTheme.ts`
- **Top Contributed Files:** `useChangePasswordForm.ts`, `useEventForm.ts`, `useGenerator.ts`
- **Recent Focus:** Phase 1 refactoring separating concerns into specialized hooks (Oct 30, 2025), React Hook Form migration eliminating duplicate validation logic and improving form state management, password change flow fixes resolving race conditions with immediate redirect using `window.location.href` (Oct 31), and CI/CD integration with GitHub Actions ensuring test stability.
- **Module Relationships:** Consumed by `src/components/generator`, `src/components/auth`, and `src/components/events`. Interfaces with `src/lib/services` for business operations and `src/db/supabase.client.ts` for authentication. Implements Facade pattern for simplified component integration.

### `docs`

- **Role:** Project documentation covering testing, CI/CD, and deployment
- **Key Files/Areas:**
  - Testing Docs: `testing-setup.md`, `testing-cleanup.md`, `testing-quick-reference.md`
  - CI/CD Docs: `ci-cd-setup.md`, `ci-cd-testing-integration.md`, `github-secrets-security.md`
  - Deployment Docs: `cloudflare-deployment.md`, `cloudflare-troubleshooting.md`
  - Manual Tests: `manual-tests/*.md` (7 API endpoint test plans)
- **Top Contributed Files:** Various testing and CI/CD documentation files
- **Recent Focus:** Comprehensive documentation for testing infrastructure, CI/CD pipeline setup with GitHub Actions, Cloudflare Pages deployment guide, security documentation for GitHub Secrets

### `src/components/ui`

- **Role:** Reusable UI components from Shadcn/ui library
- **Key Files/Areas:**
  - Form Components: `FormField.tsx` (133 LOC, reusable abstraction), `Input.tsx`, `Label.tsx`, `Select.tsx`, `Textarea.tsx`
  - Interactive Components: `Button.tsx`, `Dialog.tsx`, `Tooltip.tsx`
  - Feedback Components: `Sonner.tsx` (toast notifications)
- **Top Contributed Files:** `FormField.tsx`, `Button.tsx`, `Dialog.tsx`
- **Recent Focus:** Creation of FormField abstraction eliminating 35-40 LOC per field repetition, dark mode support across all components, accessibility improvements with ARIA attributes

### `src/components/events`

- **Role:** Event list management and CRUD operations interface
- **Key Files/Areas:**
  - List Components: `EventsList.tsx`, `EventCard.tsx`, `EventMeta.tsx`, `EventActions.tsx`
  - Filter Components: `EventsFilters.tsx`, `EventsSort.tsx`
  - Edit Components: `InlineEditArea.tsx`, `DeleteAction.tsx`, `CopyButton.tsx`
  - Hooks: `hooks/useEventsFilters.ts`, `hooks/useInfiniteEventsQuery.ts`
- **Top Contributed Files:** `EventsList.tsx`, `EventCard.tsx`, `EventsFilters.tsx`
- **Recent Focus:** Complete Events View implementation with infinite scroll pagination, URL-synced filters with 300ms debounce, React Query integration with optimistic updates, soft delete functionality, inline editing with validation

### `src/lib/services`

- **Role:** Business logic layer encapsulating all backend interactions including event CRUD operations, AI description generation, and category management. Implements custom error classes (`EventServiceError`, `AIGenerationError`) for precise error handling, conditional SELECT logic for guest vs authenticated users respecting RLS policies, and comprehensive audit logging for all event operations.
- **Key Files/Areas:**
  - Event Service: `events.service.ts` (5 changes - high activity, createEvent, updateEvent, getUserEvents, getEventById, softDeleteEvent)
  - AI Services: `ai/openrouter.service.ts`, `ai/generate-event-description.ts`
  - Category Service: `categories.service.ts`
  - Test Coverage: `__tests__/events.service.test.ts` (15 tests achieving 79% code coverage)
- **Top Contributed Files:** `events.service.ts`, `ai/openrouter.service.ts`
- **Recent Focus:** Comprehensive service layer implementation with custom error handling eliminating generic database errors (Oct 18-27, 2025), OpenRouter AI integration with retry logic and 30s timeout handling generation failures gracefully (Oct 23), conditional SELECT logic solving guest user RLS policy constraints, audit logging for tracking user actions and supporting compliance requirements, and extensive unit test coverage achieving 79% code coverage.
- **Module Relationships:** Central business logic consumed by `src/pages/api` routes, depends on Supabase client from `src/middleware` context, uses types from `src/types.ts`, and integrates with OpenRouter API for AI generation. Services abstract database complexity from API layer.

### `src/middleware`

- **Role:** Astro middleware layer handling request/response processing, dependency injection, and environment configuration across development, test, and production environments. Implements critical environment variable priority logic (`import.meta.env || runtime.env`) ensuring compatibility with Vite, dotenv, and Cloudflare Pages runtime. **Most frequently modified file (9 changes)** reflecting its foundational role in application initialization.
- **Key Files/Areas:**
  - Main Middleware: `index.ts` (Supabase client creation, cookie handling, environment variable fallback)
- **Top Contributed Files:** `index.ts` (9 changes - highest in entire project)
- **Recent Focus:** Critical environment variable priority fix ensuring test environment functionality (Nov 1, 2025), whitespace and line ending standardization for consistent formatting (Nov 2), Cloudflare Pages deployment configuration with runtime environment access, Supabase SSR integration replacing client-only approach for proper session handling, and continuous refinement through 9 commits addressing edge cases in authentication flow and environment variable access patterns.
- **Module Relationships:** Foundation for all modules - creates authenticated Supabase client consumed by `src/lib/services` and `src/pages/api`, injects OpenRouter API key used by AI services, and establishes environment configuration relied upon by entire application. Changes here impact every module.

### Project Root (Configuration & Infrastructure)

- **Role:** Project-level configuration orchestrating the full-stack architecture including Astro SSR setup, Cloudflare Pages adapter, test framework configuration for Vitest and Playwright, TypeScript compiler options, and ESLint rules. Recent focus on React 19 compatibility requiring `react-dom/server.edge` aliasing to resolve "MessageChannel is not defined" errors on Cloudflare Pages.
- **Key Files/Areas:**
  - Configuration: `astro.config.mjs`, `playwright.config.ts` (5 changes - high activity), `vitest.config.ts`, `tsconfig.json`, `eslint.config.js`, `components.json`, `wrangler.toml`
  - Type Definitions: `src/types.ts` (5 changes - 300+ LOC central type hub), `src/env.d.ts` (4 changes - environment declarations)
  - Documentation: `README.md`, `CHANGELOG.md`
  - Package Management: `package.json`, `.nvmrc` (Node.js 22.14.0)
- **Top Contributed Files:** `playwright.config.ts`, `src/types.ts`, `src/env.d.ts`
- **Recent Focus:** Cloudflare Pages deployment configuration with React 19 SSR compatibility fixes (Nov 1, 2025), CI/CD pipeline integration with GitHub Actions running tests and builds automatically (Oct 30-31), environment variable management ensuring proper loading across dev/test/production contexts, Playwright configuration refinements for stable E2E test execution, and comprehensive testing infrastructure setup achieving 241 unit tests and 44 E2E tests with 100% pass rate.
- **Module Relationships:** Configuration files define how all modules interact - `playwright.config.ts` configures E2E tests, `src/types.ts` provides type contracts across frontend and backend, `src/env.d.ts` declares environment interfaces for `src/middleware`, and `astro.config.mjs` orchestrates SSR and deployment strategy.

### `src/pages/api` (API Routes Layer)

- **Role:** RESTful API endpoints implementing thin route pattern - validation at boundary (Zod schemas), business logic delegation to services, and HTTP-only concerns (status codes, headers, response formatting). Key endpoint: `events/[id].ts` (4 changes) implementing GET, PATCH, DELETE operations for individual events.
- **Key Files/Areas:**
  - Event Endpoints: `events/index.ts` (POST for creation), `events/[id].ts` (4 changes - GET, PATCH, DELETE)
  - Authentication Endpoints: `auth/activity.ts`, `auth/delete-account.ts`
  - Category Endpoints: `categories/events.ts`, `categories/age.ts`
- **Top Contributed Files:** `events/[id].ts` (4 changes)
- **Recent Focus:** Core CRUD endpoints implemented sequentially (Oct 18-19, 2025), error mapping functions translating service-layer errors into HTTP responses, comprehensive validation with Zod schemas, and localized error messages in Polish.
- **Module Relationships:** Consumes Supabase client from `src/middleware` context.locals, delegates to `src/lib/services` for business logic, uses types from `src/types.ts` for contracts, and validates with schemas from `src/lib/validators`. Exemplifies separation of concerns.

### `src/db` (Database Layer)

- **Role:** Database client configuration and type definitions. `supabase.client.ts` (4 changes) creates browser-side Supabase client using `@supabase/ssr` package, validates PUBLIC_ environment variables, and exports typed client for React components.
- **Key Files/Areas:**
  - Client Configuration: `supabase.client.ts` (4 changes - browser-side client)
  - Admin Client: `supabase.admin.ts` (service role operations)
  - Type Definitions: `database.types.ts` (generated from Supabase schema)
- **Top Contributed Files:** `supabase.client.ts`
- **Recent Focus:** Foundation established early (Oct 17, 2025) with refinements during authentication backend implementation (Oct 26). Switch to `@supabase/ssr` package enabled proper SSR cookie handling.
- **Module Relationships:** Browser client consumed by `src/components/hooks` for authentication operations. Server-side client created in `src/middleware` for API routes. Types re-exported in `src/types.ts` for application-wide use.

## Key Contributors

- **Marcin Szwajgier (Devrilo):** Primary developer and architect (100% contribution, 47+ commits from Oct 15 - Nov 2, 2025). Solo contributor demonstrating full-stack mastery across all project layers. Core expertise areas include:
  - **Full-stack development:** Astro 5, React 19, TypeScript 5 with emphasis on type safety (300+ LOC in `src/types.ts`)
  - **Test infrastructure design:** Vitest (241 unit tests, 79% coverage) + Playwright (44 E2E tests, 100% pass rate) with comprehensive Page Object Model implementation
  - **CI/CD pipeline implementation:** GitHub Actions with automated testing and Cloudflare Pages deployment
  - **Code refactoring expertise:** Container/Presenter pattern (85% LOC reduction), Facade pattern (74% reduction), React Hook Form migration (42-50% reduction per form)
  - **Cloudflare Pages deployment:** React 19 SSR compatibility, environment variable fallback strategies, runtime configuration
  - **Comprehensive documentation:** 15+ documentation files covering testing, CI/CD, deployment, and manual test plans
  - **Areas of highest activity:**
    - `src/middleware/index.ts` (9 changes) - environment configuration and dependency injection
    - `playwright.config.ts` (5 changes) - E2E test infrastructure stabilization
    - `src/types.ts` (5 changes) - type system evolution with feature additions
    - `src/lib/services/events.service.ts` (5 changes) - business logic implementation
    - `src/components/hooks/useChangePasswordForm.ts` (5 changes) - authentication flow refinements

## Overall Takeaways & Recent Focus

1. **Testing Infrastructure Maturity (Oct 27 - Nov 2, 2025):** Achieved production-ready testing coverage with 241 passing unit tests (79% code coverage) and 44 passing E2E tests (100% pass rate excluding 4 intentional feature skips). **Critical recent work:** Resolution of password change race condition using `window.location.href` for immediate redirect (Oct 31), `.env.test` loading fixes for Playwright workers (Nov 1), sequential test execution pattern (1 worker) preventing JWT session conflicts, and global database cleanup with service role key. E2E tests now demonstrate consistent stability across CI/CD environments.

2. **Production Deployment Stabilization (Oct 31 - Nov 2, 2025):** **Highest priority recent activity** focused on Cloudflare Pages deployment. `src/middleware/index.ts` underwent 9 changes, with 5 commits in final 3 days addressing environment variable priority (`import.meta.env || runtime.env`), whitespace/line ending standardization (CRLF → LF), and constant value fixes. React 19 compatibility required `react-dom/server.edge` aliasing. This represents a shift from feature development to production readiness.

3. **Code Quality & Refactoring (Oct 30, 2025):** Systematic refactoring achieving 42-85% LOC reductions through pattern application. **Key milestone:** Container/Presenter pattern refactoring of `GeneratorPage.tsx` (238 LOC → 36 LOC, Oct 30), Facade pattern in hooks (`useGeneratorFlow.ts` splitting into 4 specialized hooks, 74% reduction), and React Hook Form migration for all authentication forms (42-50% reduction per form). This represents architectural maturity and focus on maintainability.

4. **Feature Development Timeline:** Complete MVP feature set implemented sequentially: Initial event generator (Oct 22), dark mode (Oct 23), OpenRouter AI integration (Oct 23), authentication backend (Oct 26), Events View with infinite scroll (Oct 27), E2E tests (Oct 30), and account management flows (Oct 30). Feature development essentially complete by Oct 30, with subsequent work focused on stability and deployment.

5. **Multi-Environment Configuration Strategy:** Environment variable management emerged as critical complexity area requiring iterative refinement. Three-tier fallback system (`import.meta.env` for Vite/dotenv → `runtime.env` for Cloudflare) implemented across middleware, with separate `.env` and `.env.test` files for development and testing. `playwright.config.ts` underwent 5 changes stabilizing test environment. This pattern reflects real-world challenges of deploying modern full-stack apps across multiple platforms.

6. **Type Safety & API Design:** `src/types.ts` (5 changes, 300+ LOC) serves as central contract hub, evolving with each feature addition. Separation of DTOs (backend contracts), view models (UI representations), and form types (validation schemas) enforces clear layer boundaries. API routes follow thin route pattern - validation at boundary, delegation to services, HTTP-only concerns in routes.

## Potential Complexity/Areas to Note

- **High-Change Rate Files (Knowledge Sharing Priority):** Analysis reveals files with frequent modifications requiring special attention:
  - `src/middleware/index.ts` (9 changes) - **Highest in project**, critical infrastructure file, any changes impact entire application
  - `playwright.config.ts` (5 changes) - Test configuration requiring understanding of environment variable loading, timeout patterns
  - `src/types.ts` (5 changes) - Central type hub touching all modules when updated
  - `src/lib/services/events.service.ts` (5 changes) - Complex business logic with RLS considerations
  - `src/components/hooks/useChangePasswordForm.ts` (5 changes) - Authentication flow with race condition history
  
  **Recommendation:** New developers should pair with experienced team members when modifying these files.

- **Middleware Environment Variable Priority (CRITICAL - DO NOT CHANGE):** The middleware (`src/middleware/index.ts`) uses a specific priority order (`import.meta.env || runtime.env`) for environment variables. This was established through 9 iterations including critical fixes on Nov 1-2, 2025. **Documented issue:** Reversing this order breaks test environment functionality. The pattern ensures compatibility across:
  - Development: Vite's `import.meta.env`
  - Testing: dotenv-loaded `import.meta.env` via `playwright.config.ts`
  - Production: Cloudflare runtime `runtime.env`
  
  **Git history context:** Last 5 commits to this file show iterative refinement addressing whitespace, line endings, and constant values - indicating production deployment stabilization phase.

- **Guest vs Authenticated Event Creation (Dual-Path Complexity):** The `createEvent` service (`src/lib/services/events.service.ts`, 5 changes) implements conditional SELECT logic creating two distinct execution paths:
  - **Authenticated path:** INSERT with `.select()` retrieving DB-generated id, followed by audit logging
  - **Guest path:** INSERT without `.select()` (RLS blocks SELECT for anon role), uses `crypto.randomUUID()` for temporary display id, skips audit logging
  
  **Why it exists:** Supabase Row Level Security policies prevent anonymous users from SELECT operations while allowing INSERT. This dual-path logic emerged during service layer implementation (Oct 18-30, 2025) and is documented in code comments with DEBUG logging for troubleshooting.

- **Password Change Race Condition (Solved but Documented):** `useChangePasswordForm.ts` (5 changes) underwent multiple iterations to resolve race condition between React state updates and authentication state changes. **Solution:** Immediate redirect using `window.location.href` instead of React routing, implemented Oct 31, 2025. This pattern should be followed for any authentication flows requiring forced re-authentication.

- **React Query + Optimistic Updates:** The Events View uses optimistic updates for mutations (edit, delete) with automatic rollback on error. Understanding React Query's cache invalidation patterns and the relationship between queries/mutations is essential for maintaining data consistency. This pattern introduced during Events View implementation (Oct 27, 2025).

- **AI Generation Timing and Constraints:** OpenRouter AI generation typically takes 10-30 seconds but can timeout at 90 seconds. E2E tests require extended timeouts (150-360s for multiple generations). The AI service validates that generated descriptions don't exceed 500 characters, and tests use short keyInformation to avoid overruns. **Documented in:** `playwright.config.ts` timeout configuration (90s default, increased for AI operations).

- **E2E Test Stability Patterns (Empirically Derived):** Several critical patterns emerged from iterative test development (Oct 27 - Nov 2, 2025):
  - Radix UI comboboxes need 1s wait after click (React hydration timing)
  - React `client:load` components require 2-4s wait for full hydration
  - Category values must use exact capitalized names from database ENUMs
  - Shadcn/ui checkboxes need `{ force: true }` to bypass covering elements
  - EventsPage requires `waitForPageReady()` to handle React Query loading states
  
  These patterns are encoded in Page Object Model classes and should be consulted before adding new E2E tests.

- **Cloudflare Pages Configuration (Production Deployment Pattern):** Environment variables must be managed exclusively through Dashboard UI (not wrangler.toml `[vars]` section which overrides Dashboard). The adapter requires `react-dom/server.edge` aliasing for React 19 SSR compatibility to avoid "MessageChannel is not defined" errors. **Documented in:** `docs/cloudflare-deployment.md` and `docs/cloudflare-troubleshooting.md`.

## Questions for the Team

**Based on git history analysis (Oct 15 - Nov 2, 2025) revealing patterns not fully documented:**

1. **Environment Configuration Evolution:** `src/middleware/index.ts` underwent 9 changes with 5 commits in final 3 days (Oct 31 - Nov 2) addressing environment variable priority, formatting, and constants. What specific issues occurred during Cloudflare deployment that drove this iteration? Are there documented runbooks for debugging environment variable issues across dev/test/production environments?

2. **Test Infrastructure Investment Rationale:** The project achieved 241 unit tests (79% coverage) and 44 E2E tests (100% pass rate) representing significant investment. Git history shows E2E tests implemented Oct 30 followed by intensive stabilization work (Oct 31 - Nov 2). What drove the decision to invest heavily in E2E testing for an MVP? Are there specific quality gates or coverage requirements for future features?

3. **Guest Event Creation Strategy:** `src/lib/services/events.service.ts` (5 changes) implements dual-path logic with temporary UUIDs for guest events and no audit logging. Git history shows this pattern emerged Oct 18-30 during service layer implementation. What are the plans for tracking or migrating guest events when users authenticate? Is there a data retention policy for guest-created events?

4. **Refactoring Pattern Adoption Timeline:** Major refactoring occurred Oct 30, 2025 (Container/Presenter, Facade patterns achieving 42-85% LOC reductions). This appears to be a single-day architectural shift after MVP features were complete. What triggered this refactoring? Are these patterns now mandatory for new features, and is there a style guide documenting when to apply each pattern?

5. **High-Change Rate File Management:** Analysis identifies `src/middleware/index.ts` (9 changes), `playwright.config.ts` (5 changes), `src/types.ts` (5 changes), and `src/lib/services/events.service.ts` (5 changes) as frequently modified. Given solo contributor context, what knowledge transfer mechanisms exist for these critical files? Should new team members receive pair programming sessions specifically for these high-complexity areas?

6. **OpenRouter AI Integration Cost & Performance:** `src/lib/services/ai/openrouter.service.ts` implemented Oct 23 with retry logic and 30s timeout. Git history shows no subsequent modifications, suggesting stability. What is the expected load profile and cost structure for production? Are there rate limiting, cost monitoring, or fallback mechanisms planned for high-traffic scenarios?

7. **Authentication Flow Race Conditions:** `useChangePasswordForm.ts` (5 changes) required multiple iterations to resolve race conditions, ultimately using `window.location.href` for immediate redirect (Oct 31). Are there similar race condition risks in other authentication flows (registration, login, account deletion)? Should this redirect pattern be codified in authentication documentation?

## Next Steps

**Recommended onboarding path based on git history analysis and high-change rate files:**

### Week 1: Foundation & Environment Setup

1. **Set up Development Environment:** Follow the installation instructions in README.md including Node.js 22.14.0 (via .nvmrc), npm install, and .env configuration with Supabase and OpenRouter credentials. Start local Supabase instance with `supabase start` and apply migrations with `supabase db reset`.

2. **Study High-Change Rate Files (Critical Knowledge Areas):**
   - **Day 1-2:** `src/middleware/index.ts` (9 changes) - Understand environment variable fallback chain (`import.meta.env || runtime.env`), Supabase SSR client creation, and cookie handling. Review all 9 commits to understand production deployment issues.
   - **Day 3:** `src/types.ts` (5 changes) - Study 300+ LOC type system, DTO vs view model separation, and how types flow through layers.
   - **Day 4-5:** `playwright.config.ts` (5 changes) - Understand E2E test configuration, `.env.test` loading, sequential execution pattern, and timeout strategies.

3. **Review Recent Commit History (Oct 31 - Nov 2, 2025):** Focus on last 10 commits showing production stabilization phase:
   ```bash
   git log --oneline --since="2025-10-31" --until="2025-11-02"
   ```
   Pay special attention to middleware refinements, E2E test fixes, and Cloudflare deployment configuration.

### Week 2: Architecture & Patterns

4. **Explore Refactored Modules (Oct 30, 2025 milestone):**
   - `src/components/generator/GeneratorPage.tsx` (4 changes) - Study Container/Presenter pattern (238 LOC → 36 LOC)
   - `src/components/hooks/useGeneratorFlow.ts` - Understand Facade pattern splitting 236 LOC into 4 specialized hooks
   - `src/components/hooks/useChangePasswordForm.ts` (5 changes) - Review React Hook Form migration and race condition resolution

5. **Trace Full-Stack Request Flow:**
   - Start: User submits event form in browser
   - Frontend: `src/components/generator/GeneratorPage.tsx` → `useGenerator` hook
   - API: `src/pages/api/events/index.ts` (Zod validation)
   - Service: `src/lib/services/events.service.ts` (5 changes) - Study conditional SELECT logic for guests vs authenticated users
   - AI: `src/lib/services/ai/generate-event-description.ts`
   - Database: Supabase client from `src/middleware/index.ts` context
   - Response: Type-safe DTOs from `src/types.ts`

6. **Run Test Suites & Study Patterns:**
   ```bash
   npm test  # 241 unit tests, 79% coverage
   npm run test:e2e:ui  # 44 E2E tests with Playwright UI
   ```
   Focus on:
   - `tests/e2e/02-generator.spec.ts` (10 tests) - AI generation flow
   - `tests/e2e/04-account-management.spec.ts` (7/9 tests) - Authentication patterns
   - `src/lib/services/__tests__/events.service.test.ts` (15 tests) - Service layer testing patterns

### Week 3: Advanced Topics & Documentation

7. **Study Multi-Environment Configuration Strategy:**
   - Compare `.env.local.example` and `.env.example` structures
   - Review `docs/cloudflare-deployment.md` and `docs/cloudflare-troubleshooting.md`
   - Understand why `import.meta.env` has priority over `runtime.env` (critical for test environment)

8. **Explore Guest vs Authenticated User Patterns:**
   - Read `src/lib/services/events.service.ts` `createEvent` function with DEBUG logging
   - Understand RLS policy implications (why guests can't use `.select()`)
   - Study temporary UUID generation for guest events

9. **Review E2E Test Stability Patterns (Empirically Derived):**
   - Study Page Object Model in `tests/e2e/pages/`
   - Note wait times: 1s for Radix UI, 2-4s for React hydration
   - Review `waitForPageReady()` implementation in `EventsPage.ts`

### Ongoing: Documentation Improvements

10. **Contribute Documentation Based on Findings:**
    - **High Priority:** Document `src/middleware/index.ts` environment variable priority rationale and failure modes
    - **Medium Priority:** Create architectural decision record (ADR) for Container/Presenter and Facade pattern adoption
    - **Medium Priority:** Document high-change rate files (`src/middleware/index.ts`, `playwright.config.ts`, `src/types.ts`) with troubleshooting guides
    - **Low Priority:** Expand inline documentation in `src/lib/services/events.service.ts` explaining RLS dual-path logic

11. **Pair Programming Recommendations:**
    - Request pair session for first modification to any file with 4+ changes
    - Specifically: `src/middleware/index.ts` (9), `playwright.config.ts` (5), `src/types.ts` (5), `src/lib/services/events.service.ts` (5), `useChangePasswordForm.ts` (5)

## Development Environment Setup

1. **Prerequisites:**
   - Node.js 22.14.0 (specified in `.nvmrc`)
   - npm (package manager)
   - Supabase CLI (for local database: `npm install -g supabase`)
   - Git for version control

2. **Dependency Installation:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   
   The project uses **two separate environment files** for different purposes:
   
   ### `.env` - Local Development
   Create a `.env` file in project root for local development server:
   ```bash
   # Supabase Configuration (Server-side)
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Supabase Configuration (Client-side)
   PUBLIC_SUPABASE_URL=your-supabase-url
   PUBLIC_SUPABASE_KEY=your-supabase-anon-key

   # OpenRouter API Configuration
   OPENROUTER_API_KEY=sk-or-v1-your-api-key
   ```
   See `.env.local.example` for reference.
   
   ### `.env.test` - E2E Testing
   Create a `.env.test` file in project root for Playwright E2E tests:
   ```bash
   # Supabase Configuration (Test Database)
   SUPABASE_URL=your-test-supabase-url
   SUPABASE_KEY=your-test-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
   PUBLIC_SUPABASE_URL=your-test-supabase-url
   PUBLIC_SUPABASE_KEY=your-test-supabase-anon-key

   # OpenRouter API Configuration
   OPENROUTER_API_KEY=sk-or-v1-your-api-key

   # E2E Test User Credentials
   E2E_USERNAME=test-user@example.com
   E2E_PASSWORD=your-test-user-password
   E2E_USERNAME_ID=uuid-of-test-user
   ```
   See `.env.example` for all available variables.
   
   **Important Notes:**
   - `.env.test` is loaded by `playwright.config.ts` using dotenv for both dev server and test workers
   - E2E tests require a separate test database to avoid conflicts with local development data
   - Test user credentials (`E2E_USERNAME`, `E2E_PASSWORD`) are used by the `authenticatedPage` fixture
   - Service role key is required for global test cleanup (bypasses RLS policies)
   - Both files are gitignored for security

4. **Database Setup:**
   ```bash
   # Start local Supabase instance
   supabase start

   # Apply migrations
   supabase db reset
   ```

5. **Running the Application:**
   ```bash
   # Development server
   npm run dev

   # Production build
   npm run build

   # Preview production build
   npm run preview
   ```

6. **Running Tests:**
   ```bash
   # Unit tests
   npm test

   # Unit tests with coverage
   npm run test:coverage

   # E2E tests
   npm run test:e2e

   # E2E tests with UI mode
   npm run test:e2e:ui
   ```

7. **Common Issues:**
   - **Supabase connection errors:** Ensure local Supabase is running with `supabase status`. Check that environment variables in `.env` match the output from `supabase start`.
   - **E2E test failures:** Tests require `.env.test` file with test database credentials (separate from `.env`). Verify E2E_USERNAME, E2E_PASSWORD, and E2E_USERNAME_ID are set. Use `npm run test:e2e:ui` to debug failing tests interactively.
   - **"E2E_USERNAME or E2E_PASSWORD not found" warning:** This indicates `.env.test` is missing or not loaded correctly. Create `.env.test` in project root with test credentials.
   - **Test database cleanup issues:** Requires SUPABASE_SERVICE_ROLE_KEY in `.env.test` for global teardown to bypass RLS policies and delete test data.
   - **React 19 hydration warnings:** Wait times (2-4s) are intentional for client:load components. See test fixtures for patterns.
   - **Cloudflare local testing:** Use `npm run dev` with platformProxy enabled. For production simulation, build first then use `npx wrangler pages dev dist`.
   - **Environment variable not loading:** Ensure correct file is used - `.env` for `npm run dev`, `.env.test` for `npm run test:e2e`. Playwright loads `.env.test` automatically via dotenv in both `playwright.config.ts` and `fixtures.ts`.

## Helpful Resources

- **Documentation:** Comprehensive project documentation in `/docs` directory including:
  - Testing setup and strategies: `docs/testing-setup.md`
  - CI/CD configuration: `docs/ci-cd-setup.md`
  - Cloudflare deployment: `docs/cloudflare-deployment.md`
  - Manual API test plans: `docs/manual-tests/*.md`

- **Issue Tracker:** GitHub Issues at https://github.com/Devrilo/CulturAllyAI/issues

- **Contribution Guide:** See `.github/copilot-instructions.md` for coding practices, project structure guidelines, and architectural patterns to follow when contributing

- **Communication Channels:** Project-specific communication channel not found in checked files. Contact repository owner for team communication details.

- **External Framework Documentation:**
  - Astro 5: https://docs.astro.build/
  - React 19: https://react.dev/
  - Supabase: https://supabase.com/docs
  - Playwright: https://playwright.dev/
  - Vitest: https://vitest.dev/
  - Cloudflare Pages: https://developers.cloudflare.com/pages/

## Project Roadmap & Future Enhancements

Based on the codebase analysis, the following features are planned but not yet implemented:

**Skipped E2E Tests (Future Features):**
- Category filtering in Events View (currently skipped in tests)
- Inline editing UI improvements (currently skipped in tests)
- Same password validation with current password check (timeout issue to be resolved)
- Account deletion requiring Admin API key integration (planned enhancement)

**Mentioned Future Enhancements:**
- Additional mobile support and responsive design improvements
- Advanced social features (event sharing, collaborative editing)
- Extended integrations with external event platforms
- Advanced profile features and user preferences

**Architectural Considerations:**
- Domain-Driven Design (DDD) refactoring proposal exists in `docs/ddd-refactoring-proposal.md` for improved maintainability and scalability
- Potential migration from Cloudflare Pages to containerized deployment (Docker) for better portability if needed

**Note:** These enhancements are documented but not currently prioritized for implementation. Check with the team for current roadmap priorities.
