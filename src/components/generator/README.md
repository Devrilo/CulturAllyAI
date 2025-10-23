# Generator View - Component Structure

## Overview

Generator view allows users (guests or authenticated) to generate event descriptions using AI.

## Component Hierarchy

```
GeneratorPage (main container)
├── AuthPromptBanner (conditional: guests only)
├── TimeoutNotice (conditional: when generation >10s)
└── Main Layout (2-column grid)
    ├── EventForm (left column)
    │   ├── Input fields (title, city, date)
    │   ├── Select fields (category, age_category)
    │   ├── Textarea (key_information)
    │   └── CharacterCounter (inline, absolute position)
    └── DescriptionPanel (right column)
        ├── Header (title + copy button)
        ├── DescriptionPreview (generated text only)
        └── Action Row (justify-between layout)
            ├── ActionButtons (Generate + Save)
            └── RatingButtons (ThumbsUp + ThumbsDown)
```

**Note:** Global header is in `src/layouts/Layout.astro` and shared across all pages. It includes navigation (Moje wydarzenia, Profil for authenticated users) and theme toggle.

## Components

### Core

- **GeneratorPage.tsx** - Main container with React Query & state management
- **AppHeader.tsx** - Global app header with auth state management (used in Layout.astro)
- **Header.tsx** - Presentation component for header with navigation and auth controls
- **ThemeToggle.tsx** - Dark/light mode toggle button
- **EventForm.tsx** - Event input form with validation
- **DescriptionPanel.tsx** - Container for preview and actions

### Preview & Actions

- **DescriptionPreview.tsx** - Display generated description (text only, no metadata)
- **ActionButtons.tsx** - Generate and Save buttons (Copy moved to header)
- **RatingButtons.tsx** - Thumbs up/down rating (right-aligned in action row)

### Utility

- **CharacterCounter.tsx** - Reusable character count display
- **AuthPromptBanner.tsx** - Login prompt for guests
- **TimeoutNotice.tsx** - Alert for slow generation

## State Management

### Hooks

- `useSupabaseSession` - Auth state monitoring
- `useEventForm` - Form values, errors, validation (Zod)
- `useGeneratorFlow` - Mutations, timeout tracking, clipboard
- `useTheme` - Dark/light mode management with localStorage persistence

### React Query

- Queries: GET /api/categories/events, /api/categories/age
- Mutations: POST /api/events, PATCH /api/events/:id

## Key Features

### Dark Mode

- System preference detection with `window.matchMedia`
- localStorage persistence (`theme` key: 'light', 'dark', or 'system')
- Toggle button in global header (sun/moon icon)
- Seamless theme switching without page reload
- Prevents flash of unstyled content (FOUC) with inline script in Layout.astro
- CSS custom properties for theme colors

### Navigation

- **Authenticated users:**
  - "Moje wydarzenia" (link to /events with FileText icon)
  - "Profil" (link to /profile with User icon)
  - "Wyloguj" (sign out button)
- **Guest users:**
  - "Zaloguj się" (link to /login)
  - "Zarejestruj się" (link to /register)

### Validation

- Real-time Zod validation with 300ms debounce
- Inline error messages per field
- Character counters with absolute positioning (red >90%, destructive >100%)
- Polish error messages for better UX

### Layout & UX

- **Copy button** - In header next to "Wygenerowany opis" title
- **Action row** - Generate and Save on left, rating buttons on right (justify-between)
- **Clean preview** - Only generated description text (no metadata display)
- Skeleton loading states
- Toast notifications (sonner)
- Timeout notice >10s
- Debounced actions (prevent double-click)
- AbortController for request cancellation

## Accessibility

- ARIA labels and live regions
- Keyboard navigation support
- Screen reader friendly
- Error announcements (role="alert")
- Color + text for state indication

## Styling

- Tailwind 4 utility classes
- Shadcn/ui components
- Responsive grid (mobile: stack, desktop: 2-col)
- Dark mode support with CSS variables
