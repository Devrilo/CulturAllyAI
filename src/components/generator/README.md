# Generator View - Component Structure

## Overview
Generator view allows users (guests or authenticated) to generate event descriptions using AI.

## Component Hierarchy

```
GeneratorPage (main container)
├── Header (navigation + auth controls)
├── AuthPromptBanner (conditional: guests only)
├── TimeoutNotice (conditional: when generation >10s)
└── Main Layout (2-column grid)
    ├── EventForm (left column)
    │   ├── Input fields (title, city, date)
    │   ├── Select fields (category, age_category)
    │   ├── Textarea (key_information)
    │   └── CharacterCounter (per field)
    └── DescriptionPanel (right column)
        ├── DescriptionPreview
        │   ├── Skeleton (loading state)
        │   └── Generated text + metadata
        ├── ActionButtons
        │   ├── Generate (Sparkles icon)
        │   ├── Save (Bookmark icon, auth-only)
        │   └── Copy (Copy icon)
        └── RatingButtons (conditional: when generated)
            ├── ThumbsUp
            └── ThumbsDown
```

## Components

### Core

- **GeneratorPage.tsx** - Main container with React Query & state management
- **Header.tsx** - App header with login/logout
- **EventForm.tsx** - Event input form with validation
- **DescriptionPanel.tsx** - Container for preview and actions

### Preview & Actions

- **DescriptionPreview.tsx** - Display generated description
- **ActionButtons.tsx** - Generate/Save/Copy actions
- **RatingButtons.tsx** - Thumbs up/down rating

### Utility

- **CharacterCounter.tsx** - Reusable character count display
- **AuthPromptBanner.tsx** - Login prompt for guests
- **TimeoutNotice.tsx** - Alert for slow generation

## State Management

### Hooks
- `useSupabaseSession` - Auth state monitoring
- `useEventForm` - Form values, errors, validation (Zod)
- `useGeneratorFlow` - Mutations, timeout tracking, clipboard

### React Query
- Queries: GET /api/categories/events, /api/categories/age
- Mutations: POST /api/events, PATCH /api/events/:id

## Key Features

### Validation
- Real-time Zod validation with 300ms debounce
- Inline error messages per field
- Character counters (red >90%, destructive >100%)

### Auth
- Public access for generation
- Auth-only: save, rate
- Guest prompt banner after generation

### UX
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
- Dark mode support
