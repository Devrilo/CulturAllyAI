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
- ✅ AI mock service for event description generation
- ✅ Supabase Auth integration (client-side authentication)
- 🚧 Frontend UI (in progress)
- 📋 Additional event management features (planned)

## 10. License

This project is open source under the MIT License.
