# CulturAllyAI

## 1. Project Name

CulturAllyAI

## 2. Project Description

CulturAllyAI is a simple web application designed to generate concise, engaging, and factual descriptions of cultural events using LLMs based solely on user-provided input. It enables organizers, cultural institutions, and volunteers to quickly obtain well-structured event descriptions without the need for extensive manual editing.

## Table of Contents

- [Project Name](#1-project-name)
- [Project Description](#2-project-description)
- [Tech Stack](#3-tech-stack)
- [Getting Started Locally](#4-getting-started-locally)
- [Available Scripts](#5-available-scripts)
- [Project Structure](#6-project-structure)
- [API Endpoints](#7-api-endpoints)
- [Project Scope](#8-project-scope)
- [Project Status](#9-project-status)
- [License](#10-license)

## 3. Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, authentication, and backend services)
- **AI Integration:** Openrouter.ai for connecting to various AI models
- **CI/CD & Hosting:** GitHub Actions, DigitalOcean

## 4. Getting Started Locally

### Prerequisites

- **Node.js:** Version specified in [.nvmrc](./.nvmrc) - currently **22.14.0**
- **Package Manager:** npm

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Devrilo/CulturAllyAI.git
cd CulturAllyAI
npm install
```

### Database Setup

This project uses Supabase for the database. To set up the local development database:

1. Install Supabase CLI (if not already installed):
```bash
npm install -g supabase
```

2. Start the local Supabase instance:
```bash
supabase start
```

3. Apply migrations (automatically applied on start, but you can manually run):
```bash
supabase db reset
```

**Note:** The latest migration (`20251019120000_add_event_rated_action_type.sql`) adds the `event_rated` action type to enable separate tracking of user rating actions in analytics.

### Running the Project

To start the development server:

```bash
npm run dev
```

Then open your browser and navigate to `http://localhost:3000`.

## 5. Available Scripts

- **npm run dev:** Starts the Astro development server (`astro dev`).
- **npm run build:** Builds the production version of the site (`astro build`).
- **npm run preview:** Previews the production build locally (`astro preview`).
- **npm run astro:** Runs Astro CLI commands.
- **npm run lint:** Runs code linting via ESLint.
- **npm run lint:fix:** Fixes linting issues.
- **npm run format:** Formats code using Prettier.

## 6. Project Structure

```
CulturAllyAI/
├── src/
│   ├── components/        # UI components (Astro & React)
│   │   └── ui/           # Shadcn/ui components
│   ├── layouts/          # Astro layouts
│   ├── pages/            # Astro pages and API routes
│   │   ├── api/          # API endpoints
│   │   │   └── events/   # Event-related endpoints
│   │   └── index.astro   # Home page
│   ├── lib/              # Services and utilities
│   │   ├── services/     # Business logic
│   │   │   ├── ai/       # AI service (event description generation)
│   │   │   └── events.service.ts
│   │   └── validators/   # Zod validation schemas
│   ├── db/               # Supabase client and types
│   ├── middleware/       # Astro middleware
│   ├── styles/           # Global styles
│   └── types.ts          # Shared TypeScript types (DTOs)
├── supabase/
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase configuration
└── public/               # Static assets
```

## 7. API Endpoints

### Authentication

**Important:** This application uses **Supabase Auth** for user authentication. All authentication operations are handled **client-side** using the Supabase JavaScript SDK (`@supabase/supabase-js`).

Authentication features include:
- User registration (email + password)
- Login/logout
- Password management
- Account deletion
- Session management with JWT tokens

The backend API does **not** provide authentication endpoints. Instead, it verifies JWT tokens issued by Supabase Auth using `supabase.auth.getUser()` in API routes.

For implementation details, see the [API Plan](.ai/api-plan.md#3-authentication-and-authorization).

### Events

#### `POST /api/events`

Creates a new event with AI-generated description.

**Authentication:** Optional (supports both authenticated users and guests)

**Request Body:**

```json
{
  "title": "Koncert Chopina",
  "city": "Warszawa",
  "event_date": "2025-12-25T19:00:00Z",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Wieczór z największymi hitami Chopina w wykonaniu Filharmonii Narodowej"
}
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid-or-null",
  "created_by_authenticated_user": true,
  "title": "Koncert Chopina",
  "city": "Warszawa",
  "event_date": "2025-12-25",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Wieczór z największymi hitami Chopina...",
  "generated_description": "Koncert Chopina to wydarzenie, które...",
  "edited_description": null,
  "saved": false,
  "feedback": null,
  "model_version": "mock-v1.0.0",
  "created_at": "2025-10-17T12:00:00Z",
  "updated_at": "2025-10-17T12:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data or JSON
- `401 Unauthorized` - Invalid authentication token
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - AI service unavailable

**Field Constraints:**

- `title`: 1-100 characters
- `city`: 1-50 characters
- `key_information`: 1-200 characters
- `event_date`: ISO 8601 format, must be today or in the future
- `category`: One of: koncerty, imprezy, teatr_i_taniec, sztuka_i_wystawy, literatura, kino, festiwale, inne
- `age_category`: One of: wszystkie, najmlodsi, dzieci, nastolatkowie, mlodzi_dorosli, dorosli, osoby_starsze

#### `PATCH /api/events/:id`

Updates selected fields of an existing event (saved status, feedback, or edited description).

**Authentication:** Required (Bearer token)

**URL Parameters:**

- `id` (UUID) - Event identifier

**Request Body (at least one field required):**

```json
{
  "saved": true,
  "feedback": "thumbs_up",
  "edited_description": "Zmodyfikowany opis wydarzenia..."
}
```

**Field Details:**

- `saved` (boolean, optional) - Mark event as saved (`true`) or unsaved (`false`)
- `feedback` (enum, optional) - User feedback: `thumbs_up`, `thumbs_down`, or `null` to clear
- `edited_description` (string, optional) - User's edited description (max 500 characters, `null` to clear)

**Example Request:**

```bash
PATCH /api/events/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "saved": true,
  "feedback": "thumbs_up"
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid",
  "created_by_authenticated_user": true,
  "title": "Koncert Chopina",
  "city": "Warszawa",
  "event_date": "2025-12-25",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Wieczór z największymi hitami Chopina...",
  "generated_description": "Koncert Chopina to wydarzenie, które...",
  "edited_description": null,
  "saved": true,
  "feedback": "thumbs_up",
  "model_version": "mock-v1.0.0",
  "created_at": "2025-10-17T12:00:00Z",
  "updated_at": "2025-10-17T12:30:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data, no fields to update, or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Attempting to update event created by guest user
- `404 Not Found` - Event not found or doesn't belong to the authenticated user
- `500 Internal Server Error` - Server error

**Field Constraints:**

- `edited_description`: Max 500 characters (empty string converted to `null`)
- `feedback`: One of: `thumbs_up`, `thumbs_down`, or `null`

**Notes:**

- Only the event owner can update their events (verified via RLS and user_id check)
- Events created by guest users cannot be updated
- At least one field must be provided in the request body
- Unchanged fields are ignored (not updated in database)
- Updates are logged in `event_management_logs` table:
  - Changing `saved` → logs `event_saved` action
  - Changing `feedback` → logs `event_rated` action
  - Changing `edited_description` → logs `event_edited` action

#### `GET /api/events`

Retrieves a paginated list of events for the authenticated user.

**Authentication:** Required (Bearer token)

**Query Parameters (all optional):**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `saved` | boolean | - | Filter by saved status (`true` or `false`) |
| `category` | string | - | Filter by event category (enum) |
| `age_category` | string | - | Filter by age category (enum) |
| `page` | integer | 1 | Page number (min: 1) |
| `limit` | integer | 20 | Items per page (min: 1, max: 100) |
| `sort` | string | `created_at` | Sort field: `created_at`, `event_date`, or `title` |
| `order` | string | `desc` | Sort order: `asc` or `desc` |

**Example Request:**

```bash
GET /api/events?saved=true&category=koncerty&page=1&limit=10&sort=event_date&order=asc
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-uuid",
      "created_by_authenticated_user": true,
      "title": "Koncert Chopina",
      "city": "Warszawa",
      "event_date": "2025-12-25",
      "category": "koncerty",
      "age_category": "dorosli",
      "key_information": "Wieczór z największymi hitami Chopina...",
      "generated_description": "Koncert Chopina to wydarzenie, które...",
      "edited_description": null,
      "saved": true,
      "feedback": null,
      "created_at": "2025-10-17T12:00:00Z",
      "updated_at": "2025-10-17T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Server error

**Notes:**

- Returns only events belonging to the authenticated user (RLS enforced)
- Empty results return `200 OK` with an empty `data` array (not `404`)
- The `model_version` field is excluded from the response for optimization
- Query parameters are automatically transformed (e.g., string "true" → boolean true)
- Invalid enum values return `400` with validation details

#### `GET /api/events/:id`

Retrieves a single event by ID for the authenticated user.

**Authentication:** Required (Bearer token)

**URL Parameters:**

- `id` (UUID) - Event identifier

**Example Request:**

```bash
GET /api/events/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid",
  "created_by_authenticated_user": true,
  "title": "Koncert Chopina",
  "city": "Warszawa",
  "event_date": "2025-12-25",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Wieczór z największymi hitami Chopina...",
  "generated_description": "Koncert Chopina to wydarzenie, które...",
  "edited_description": null,
  "saved": false,
  "feedback": null,
  "model_version": "mock-v1.0.0",
  "created_at": "2025-10-17T12:00:00Z",
  "updated_at": "2025-10-17T12:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Event not found or doesn't belong to the authenticated user
- `500 Internal Server Error` - Server error

**Notes:**

- Returns only events belonging to the authenticated user (RLS enforced)
- Events created by guest users (user_id = null) are not accessible
- Returns full event object including `model_version` field (unlike GET /api/events)
- Double security: RLS policy + explicit user_id filter in query
- 404 response for both non-existent events and events belonging to other users (prevents ID enumeration)

#### `DELETE /api/events/:id`

Performs soft delete on an event by setting the `saved` field to `false`.

**Authentication:** Required (Bearer token)

**URL Parameters:**

- `id` (UUID) - Event identifier

**Example Request:**

```bash
DELETE /api/events/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "message": "Event removed from saved list",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Attempting to delete event created by guest user
- `404 Not Found` - Event not found or doesn't belong to the authenticated user
- `500 Internal Server Error` - Server error

**Notes:**

- Performs **soft delete** - sets `saved = false` instead of removing the record
- Only the event owner can delete their events (RLS enforced)
- Events created by guest users (`created_by_authenticated_user = false`) cannot be deleted
- Deletion is logged in `event_management_logs` table with action type `event_deleted`
- The event remains in the database for analytics and audit purposes
- Double security: RLS policy + explicit user_id filter in query
- Returns 404 for both non-existent events and events belonging to other users (prevents ID enumeration)

### Categories

#### `GET /api/categories/age`

Returns a list of available age categories with Polish labels.

**Authentication:** Not required (public endpoint)

**Example Request:**

```bash
GET /api/categories/age
```

**Response (200 OK):**

```json
{
  "categories": [
    { "value": "wszystkie", "label": "Wszystkie" },
    { "value": "najmlodsi", "label": "Najmłodsi (0-3 lata)" },
    { "value": "dzieci", "label": "Dzieci (4-12 lat)" },
    { "value": "nastolatkowie", "label": "Nastolatkowie (13-17 lat)" },
    { "value": "mlodzi_dorosli", "label": "Młodzi dorośli (18-35 lat)" },
    { "value": "dorosli", "label": "Dorośli (36-64 lata)" },
    { "value": "osoby_starsze", "label": "Osoby starsze (65+ lat)" }
  ]
}
```

**Error Responses:**

- `500 Internal Server Error` - Unexpected server error (rare for static data)

**Response Headers:**

- `Cache-Control: public, max-age=3600` - Cacheable for 1 hour
- `Content-Type: application/json`

**Notes:**

- Public endpoint - no authentication required
- Returns static data (no database access) - very fast response (<10ms)
- Response can be cached by CDN and browsers for 1 hour
- 7 age categories matching the `age_category` enum in database
- Use case: Populate dropdown/select inputs in event creation forms
- Response size: ~250-350 bytes JSON

#### `GET /api/categories/events`

Returns a list of available event categories with Polish labels.

**Authentication:** Not required (public endpoint)

**Example Request:**

```bash
GET /api/categories/events
```

**Response (200 OK):**

```json
{
  "categories": [
    { "value": "koncerty", "label": "Koncerty" },
    { "value": "imprezy", "label": "Imprezy" },
    { "value": "teatr_i_taniec", "label": "Teatr i taniec" },
    { "value": "sztuka_i_wystawy", "label": "Sztuka i wystawy" },
    { "value": "literatura", "label": "Literatura" },
    { "value": "kino", "label": "Kino" },
    { "value": "festiwale", "label": "Festiwale" },
    { "value": "inne", "label": "Inne" }
  ]
}
```

**Error Responses:**

- `500 Internal Server Error` - Unexpected server error (rare for static data)

**Response Headers:**

- `Cache-Control: public, max-age=3600` - Cacheable for 1 hour
- `Content-Type: application/json`

**Notes:**

- Public endpoint - no authentication required
- Returns static data (no database access) - very fast response (<10ms)
- Response can be cached by CDN and browsers for 1 hour
- 8 event categories matching the `event_category` enum in database
- Use case: Populate dropdown/select inputs in event creation forms
- Response size: ~300-400 bytes JSON

## 8. Project Scope

The MVP includes:

- A user-friendly event description creation form capturing city, date, category, age category, title, and key information.
- AI-generated event descriptions (up to 500 characters) based on user input.
- User authentication via Supabase Auth (client-side, email + password).
- Event management features such as saving, editing, and deleting event descriptions.
- A rating system for evaluating generated descriptions (thumbs up/down).
- Clipboard functionality for quick copying of event descriptions.

Future enhancements may include additional mobile support, advanced social features, and extended integrations.

## 9. Project Status

This project is currently in the MVP stage, focused on delivering a robust foundation for cultural event description generation.

**Current Development Status:**

- ✅ Database schema and migrations
- ✅ API endpoint for event creation (POST /api/events)
- ✅ API endpoint for event updates (PATCH /api/events/:id)
- ✅ API endpoint for retrieving user events (GET /api/events)
- ✅ API endpoint for retrieving single event (GET /api/events/:id)
- ✅ API endpoint for soft delete (DELETE /api/events/:id)
- ✅ API endpoint for age categories (GET /api/categories/age)
- ✅ API endpoint for event categories (GET /api/categories/events)
- ✅ AI mock service for event description generation
- ✅ Supabase Auth integration (client-side authentication)
- 🚧 Frontend UI (in progress)
- 📋 Additional event management features (planned)

## 10. License

This project is open source under the MIT License.
