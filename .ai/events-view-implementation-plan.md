# Plan implementacji widoku Moje Wydarzenia

## 1. Przegl�d

Widok Moje Wydarzenia dostarcza zalogowanemu u�ytkownikowi pe�en przegl�d zapisanych opis�w wydarze�. Umo�liwia filtrowanie, sortowanie, ocenianie trafno�ci, edycj� opis�w, kopiowanie tre�ci oraz usuwanie zapis�w.

## 1A. Design decisions

### Middleware i routing

- Widok `/events` chroniony middleware (redirect `/login` dla niezalogowanych)
- Session auto-refresh przez Supabase SDK

### Cache i React Query

- Query key: `['events', { saved: true, ...filters }]`, staleTime: 5min
- Invalidacja po mutacjach, optimistic updates z rollback

### Concurrent operations

- Debounce 300ms na filtrach
- Disabled state podczas mutacji, AbortController dla ka�dej karty

### URL synchronization i pagination

- Filtry/sortowanie w URLSearchParams z debounce 300ms
- InfiniteScroll (IntersectionObserver), fallback przycisk, page size 20

## 2. Routing widoku

Widok pod `/events` renderowany przez `src/pages/events.astro`, kt�ry montuje `EventsPage`.

## 3. Struktura komponent�w

- `EventsPage`
  - `EventsHeader`
  - `EventsLayout`
    - `FiltersBar` (z `SortSelect`)
    - `EventsSummary`
    - `ErrorBoundary`
      - `EventList`
        - `EventCard[]` (z `EventMeta`, `InlineEditArea`, `CardActions`)
          - `CopyButton`
          - `RatingButtons`
          - `DeleteAction` (otwiera `ConfirmationModal`)
        - `InfiniteScrollObserver`
    - `EmptyState`
  - `ToastViewport`

## 4. Szczeg�y komponent�w

### EventsPage

- **Opis:** punkt wejścia; inicjuje React Query, pobiera filtry z URL, renderuje layout.
- **Główne elementy:** QueryClient provider, `EventsHeader`, `EventsLayout`, `ToastViewport`.
- **Interakcje:** inicjalizacja filtrów z URL, `signOut()`.
- **Walidacja:** weryfikacja sesji; brak → redirect.
- **Propsy:** `{ supabase: SupabaseClient; initialCategories?: EventCategoryDTO[]; initialAgeCategories?: AgeCategoryDTO[]; }`.

### EventsHeader

- **Opis:** pasek g�rny z nazw� sekcji, linkiem do ustawie�, wylogowaniem.
- **G��wne elementy:** `header`, link `/settings`, `Button` wyloguj.
- **Interakcje:** `signOut()`, nawigacja `/settings`.
- **Propsy:** `{ onSignOut: () => Promise<void>; }`.

### EventsLayout

- **Opis:** layout grid między filtrami i listą.
- **Propsy:** `{ sidebar: ReactNode; main: ReactNode; }` lub `{ children: ReactNode; }`.

### FiltersBar

- **Opis:** panel filtr�w (kategorie, wiek, sortowanie).
- **G��wne elementy:** `Select` Shadcn, przycisk reset.
- **Interakcje:** zmiana debounce 300ms `onChange`.
- **Walidacja:** tylko warto�ci z list DTO.
- **Propsy:** `{ filters: EventsFiltersState; categories: EventCategoryDTO[]; ageCategories: AgeCategoryDTO[]; onChange: (filters) => void; disabled: boolean; }`.

### SortSelect

- **Opis:** kontrolka sortowania.
- **Walidacja:** tylko `"created_at" | "event_date" | "title"` i `"asc" | "desc"`.
- **Propsy:** `{ value: EventsSortOption; onChange: (value) => void; disabled: boolean; }`.

### EventsSummary

- **Opis:** licznik wydarze� i aktywne filtry.
- **Propsy:** `{ total: number; activeFilters: number; onClearFilters?: () => void; }`.

### ErrorBoundary

- **Opis:** przechwytuje b��dy API (401/403/500).
- **Interakcje:** retry, redirect dla 401/403.
- **Propsy:** `{ onRetry: () => void; onUnauthorized: () => void; children: ReactNode; }`.

### EventList

- **Opis:** renderuje karty + infinite scroll.
- **G��wne elementy:** `div` z list� kart, skeleton, `InfiniteScrollObserver`.
- **Interakcje:** auto-fetch next page.
- **Propsy:** `{ events: SavedEventViewModel[]; status: EventsListStatus; onLoadMore: () => void; hasNextPage: boolean; }`.

### EventCard

- **Opis:** karta wydarzenia z opisem i akcjami.
- **G��wne elementy:** `article`, `EventMeta`, opis, `CardActions`.
- **Interakcje:** edycja, zapis, anulowanie, kopiowanie, ocena, usuwanie.
- **Walidacja:** blokada podczas mutacji; limit 500 znak�w; lock rating.
- **Propsy:** `{ event: SavedEventViewModel; onEditSubmit: (input: EditPayload) => Promise<void>; onCopy: (id: string) => void; onRate: (input: RatePayload) => Promise<void>; onDelete: (id: string) => Promise<void>; mutationState: EventMutationState; }`.

### EventMeta

- **Opis:** metadane (tytu�, data, miasto, kategorie).
- **Propsy:** `{ title: string; eventDateLabel: string; city: string; categoryLabel: string; ageCategoryLabel: string; }`.

### CardActions

- **Opis:** kontener akcji.
- **Walidacja:** disabled podczas mutacji.
- **Propsy:** `{ description: string; feedback: Feedback | null; onCopy: () => void; onRate: (feedback) => void; onDelete: () => void; disabled: boolean; }`.

### InlineEditArea

- **Opis:** textarea edycji z licznikiem.
- **Walidacja:** limit 500; blokada przy brak zmian lub >500.
- **Propsy:** `{ initialValue: string; pending: boolean; error?: string; onSubmit: (value: string) => void; onCancel: () => void; }`.

### RatingButtons

- **Opis:** kciuki z blokad� po wyborze.
- **Walidacja:** lock po wyborze.
- **Propsy:** `{ value: Feedback | null; pending: boolean; onRate: (feedback) => void; disabled: boolean; }`.

### CopyButton

- **Opis:** przycisk kopiowania.
- **Interakcje:** `navigator.clipboard.writeText` + toast.
- **Propsy:** `{ onCopy: () => void; disabled: boolean; }`.

### DeleteAction

- **Opis:** przycisk soft delete z modalem.
- **Propsy:** `{ onConfirm: () => void; pending: boolean; }`.

### ConfirmationModal

- **Opis:** modal potwierdzenia.
- **Propsy:** `{ open: boolean; title?: string; description?: string; confirmText?: string; cancelText?: string; variant?: "default" | "destructive"; onConfirm: () => void; onCancel: () => void; pending: boolean; }`.

### InfiniteScrollObserver

- **Opis:** sentinel IntersectionObserver.
- **Propsy:** `{ onIntersect: () => void; disabled: boolean; rootMargin?: string; }`.

### EmptyState

- **Opis:** komunikat pustej listy.
- **Propsy:** `{ visible: boolean; }`.

## 5. Typy

```typescript
interface SavedEventViewModel {
  id: string;
  title: string;
  city: string;
  eventDateISO: string;
  eventDateLabel: string;
  category: EventCategory;
  categoryLabel: string;
  ageCategory: AgeCategory;
  ageCategoryLabel: string;
  keyInformation: string;
  description: string;
  editedDescription: string | null;
  feedback: Feedback | null;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
  isGuestOwned: boolean;
  charCount: number;
}

interface EventsFiltersState {
  category?: EventCategory;
  age_category?: AgeCategory;
  sort: "created_at" | "event_date" | "title";
  order: "asc" | "desc";
  page: number;
  saved: true;
}

interface EventsSortOption {
  sort: EventsFiltersState["sort"];
  order: EventsFiltersState["order"];
}
interface EventsSummaryStats {
  total: number;
  activeFilters: number;
}
interface EventsListStatus {
  isLoading: boolean;
  isFetchingNext: boolean;
  isError: boolean;
  errorCode?: string;
}
interface EditPayload {
  id: string;
  edited_description: string;
}
interface RatePayload {
  id: string;
  feedback: Feedback;
}
interface EditFormState {
  value: string;
  charsLeft: number;
  error?: string;
}
interface EventMutationState {
  editing: Record<string, boolean>;
  rating: Record<string, boolean>;
  deleting: Record<string, boolean>;
  error?: string;
}
interface RatingState {
  current: Feedback | null;
  locked: boolean;
}
interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  status: "loading" | "ready" | "error";
}
```

### Mapowanie EventListItemDTO → SavedEventViewModel

```typescript
function mapEventToViewModel(
  event: EventListItemDTO,
  categories: EventCategoryDTO[],
  ageCategories: AgeCategoryDTO[]
): SavedEventViewModel {
  const description = event.edited_description || event.generated_description;
  return {
    id: event.id,
    title: event.title,
    city: event.city,
    eventDateISO: event.event_date,
    eventDateLabel: new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(event.event_date)
    ),
    category: event.category,
    categoryLabel: categories.find((c) => c.value === event.category)?.label ?? event.category,
    ageCategory: event.age_category,
    ageCategoryLabel: ageCategories.find((c) => c.value === event.age_category)?.label ?? event.age_category,
    keyInformation: event.key_information,
    description,
    editedDescription: event.edited_description,
    feedback: event.feedback,
    saved: event.saved,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
    isGuestOwned: !event.user_id,
    charCount: description.length,
  };
}
```

### Hooki

```typescript
// useEventsFilters: { filters, updateFilters, resetFilters, isReady }
// useInfiniteEventsQuery: { events, status, hasNextPage, fetchNextPage, refetch }
// useEventMutations: { editMutation, rateMutation, deleteMutation, mutationState }
```

## 6. Zarz�dzanie stanem

- `useInfiniteQuery`: klucz `['events', filters]`, GET `/api/events?saved=true`, page size 20.
- `useEventsFilters()`: filtry + URL sync + debounce 300ms.
- `useEditEventMutation`, `useRateEventMutation`, `useDeleteEventMutation`: optimistic updates z rollback.
- Lokalny stan karty: `isEditing`, `tempValue`.
- Toasty: `useToast` (Shadcn).

## 7. Integracja API

- `GET /api/events`: params `saved=true` + filtry → `EventsListResponseDTO` → map `SavedEventViewModel`.
- `GET /api/categories/events`: cache 1h (`staleTime: 3600000`), fallback do [] przy błędzie z retry.
- `GET /api/categories/age`: cache 1h, fallback do [] przy błędzie z retry.
- `PATCH /api/events/:id`: `UpdateEventDTO` → `EventResponseDTO` → update cache.
- `DELETE /api/events/:id`: soft delete → remove z cache.

### Audit logging

Backend automatycznie loguje akcje w `user_activity_logs`: `event_viewed`, `event_edited`, `event_rated`, `event_deleted`.

## 8. Interakcje u�ytkownika

- Filtry/sort debounce 300ms URL refetch.
- Scroll ko�ca `InfiniteScrollObserver` `fetchNextPage`.
- Edytuj `InlineEditArea` Save PATCH.
- Kopiuj clipboard + toast.
- Kciuk PATCH feedback lock.
- Usu� modal DELETE remove.
- Wyloguj `signOut` `/login`.

## 9. Warunki i walidacja

- `InlineEditArea` max 500 znak�w; blokada Save gdy >500.
- Filtry: tylko warto�ci z list DTO.
- Sort domy�lnie: `created_at desc`.
- Rating: lock je�li `feedback` istnieje.

## 10. Obs�uga b��d�w

- 400: inline error w textarea + rollback.
- 401/403 GET: toast "Sesja wygas�a" + redirect.
- 404/403 mutacji: toast + remove/lock karty.
- 500/503: `ErrorBoundary` + modal retry.
- Clipboard fail: toast + modal z instrukcj�.

## 11. Kroki implementacji

1. Zainstaluj Shadcn: `npx shadcn@latest add button input textarea select label badge dialog toast alert skeleton`.
2. Skonfiguruj `/src/pages/events.astro` z middleware protection (patrz sekcja 12).
3. Utwórz typy w `src/types.ts` lub `src/components/events/types.ts` + funkcję `mapEventToViewModel`.
4. Utwórz strukturę katalogów (patrz sekcja 11A).
5. Zaimplementuj hooki w `src/components/events/hooks/`: `useEventsFilters`, `useInfiniteEventsQuery`, `useEventMutations`.
6. Utwórz API helpers w `src/lib/api/events.ts` (patrz sekcja 11B).
7. Dodaj pobieranie kategorii (React Query z cache 1h, opcjonalnie server-side w Astro) + mapowanie do etykiet.
8. Zaimplementuj komponenty podstawowe: `EventsPage`, `EventsHeader`, `EventsLayout`, `FiltersBar`.
9. Zaimplementuj `EventList` z infinite scroll + `InfiniteScrollObserver`.
10. Zaimplementuj `EventCard` z edycją, oceną, kopiowaniem, usuwaniem.
11. Dodaj mutacje z optimistic updates i rollbackiem, invalidację cache (patrz sekcja 11C).
12. Dodaj obsługę błędów, toasty (patrz sekcja 11D), `ErrorBoundary`, `EmptyState` (patrz sekcja 11E).
13. Testy manualne zgodnie z `docs/manual-tests/`.

### 11A. Struktura katalogów

```
src/components/events/
├── EventsPage.tsx
├── EventsHeader.tsx
├── EventsLayout.tsx
├── FiltersBar.tsx
├── SortSelect.tsx
├── EventsSummary.tsx
├── EventList.tsx
├── EventCard.tsx
├── EventMeta.tsx
├── InlineEditArea.tsx
├── CardActions.tsx
├── CopyButton.tsx
├── RatingButtons.tsx
├── DeleteAction.tsx
├── ConfirmationModal.tsx
├── InfiniteScrollObserver.tsx
├── EmptyState.tsx
├── ErrorBoundary.tsx
└── hooks/
    ├── useEventsFilters.ts
    ├── useInfiniteEventsQuery.ts
    └── useEventMutations.ts
```

### 11B. API helpers (src/lib/api/events.ts)

```typescript
export async function fetchEvents(params: EventsQueryDTO): Promise<EventsListResponseDTO> {
  const query = new URLSearchParams(params as any);
  const res = await fetch(`/api/events?${query}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function updateEvent(id: string, data: UpdateEventDTO): Promise<EventResponseDTO> {
  const res = await fetch(`/api/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function deleteEvent(id: string): Promise<MessageResponseDTO> {
  const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}
```

### 11C. Invalidacja cache po mutacjach

```typescript
// Po PATCH (edit/rate): queryClient.invalidateQueries({ queryKey: ['events'] });
// Po DELETE: queryClient.invalidateQueries({ queryKey: ['events'] }); + update total w UI
```

### 11D. Teksty toastów

```typescript
// Success:
"Skopiowano opis do schowka";
"Zapisano zmiany";
"Wydarzenie usunięte";
"Dziękujemy za ocenę";

// Error:
"Nie udało się skopiować opisu";
"Nie udało się zapisać zmian";
"Nie udało się usunąć wydarzenia";
"Sesja wygasła. Zaloguj się ponownie.";
"Błąd połączenia. Sprawdź internet.";
"Nie udało się pobrać kategorii";
```

### 11E. EmptyState content

```typescript
interface EmptyStateProps {
  visible: boolean;
  filtered: boolean; // czy pusty wynik to efekt filtrów
  onReset?: () => void;
}

// Content:
// filtered=false: "Nie masz jeszcze zapisanych wydarzeń" + link "Wygeneruj pierwsze wydarzenie" → "/"
// filtered=true: "Brak wydarzeń spełniających kryteria" + przycisk "Resetuj filtry" → onReset()
```

### 11F. ConfirmationModal - przykład użycia dla DELETE

```typescript
<ConfirmationModal
  open={deleteModalOpen}
  title="Usuń wydarzenie"
  description="Czy na pewno chcesz usunąć to wydarzenie? Ta operacja jest nieodwracalna."
  confirmText="Usuń"
  cancelText="Anuluj"
  variant="destructive"
  onConfirm={handleDelete}
  onCancel={() => setDeleteModalOpen(false)}
  pending={isDeleting}
/>
```

### 11G. Pobieranie kategorii - hybrid approach

```astro
---
// src/pages/events.astro - opcjonalny server-side fetch
const categoriesRes = await fetch(`${Astro.url.origin}/api/categories/events`);
const ageCategoriesRes = await fetch(`${Astro.url.origin}/api/categories/age`);
const initialCategories = categoriesRes.ok ? (await categoriesRes.json()).categories : undefined;
const initialAgeCategories = ageCategoriesRes.ok ? (await ageCategoriesRes.json()).categories : undefined;
---

<EventsPage
  client:load
  supabase={supabase}
  initialCategories={initialCategories}
  initialAgeCategories={initialAgeCategories}
/>
```

W `EventsPage` użyj `initialData` w React Query dla szybszego initial load, ale nadal wykonaj client-side fetch dla świeżości.

## 12. Konfiguracja techniczna

### Astro + React

```astro
---
// src/pages/events.astro
import Layout from "@/layouts/Layout.astro";
import EventsPage from "@/components/events/EventsPage";

const supabase = Astro.locals.supabase;
const {
  data: { session },
} = await supabase.auth.getSession();
if (!session) return Astro.redirect("/login");
---

<Layout title="Moje Wydarzenia | CulturAllyAI">
  <EventsPage client:load supabase={supabase} />
</Layout>
```

### React Query

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 300000, refetchOnWindowFocus: true, retry: 1 },
    mutations: { retry: 0 },
  },
});

// useInfiniteQuery setup:
useInfiniteQuery({
  queryKey: ["events", filters],
  queryFn: ({ pageParam = 1 }) => fetchEvents({ ...filters, page: pageParam }),
  getNextPageParam: (lastPage) => (lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined),
  initialPageParam: 1,
  staleTime: 300000,
});
```

### Shadcn & Ikony

Components: Button, Input, Textarea, Select, Label, Badge, Dialog, Toast, Alert, Skeleton
Icons: ThumbsUp, ThumbsDown, Copy, Trash2, Edit, X

### Formatowanie dat

`Intl.DateTimeFormat('pl-PL')` - brak zewn�trznych bibliotek

## 13. UI/UX

### Responsive

- Mobile (<768px): stack, filtry accordion
- Desktop (1024px): filtry sticky left 300px, lista flex-1

### EventCard

- Base: `border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200`
- Mutacja: `opacity-60 cursor-not-allowed pointer-events-none`
- Error: `border-destructive`

### FiltersBar

- Mobile: `flex flex-col gap-4 p-4 bg-muted/50 rounded-lg`
- Desktop: `sticky top-4 w-80 h-fit p-6 bg-card border rounded-lg shadow-sm`

### Loading

- Initial: 3 skeleton cards h-48
- Infinite: spinner 32px na dole
- Mutation: spinner w przycisku

### Toasts

Position: top-right, auto-close: 3s (success), 5s (error)
Messages: "Skopiowano", "Zapisano zmiany", "Wydarzenie usuni�te", "Dzi�kujemy za ocen�", "Sesja wygas�a"

### Animations

- Card hover: `transition-shadow duration-200`
- Button: `transition-all duration-150 active:scale-95`
- Toast: slide-in-right
- Infinite scroll: fade-in nowych kart

## 14. Accessibility

### ARIA

- EventList: `role="feed"`, `aria-busy`
- EventCard: `role="article"`, `aria-label={title}`
- InlineEditArea: `aria-invalid`, `aria-describedby={errorId}`
- Buttons: `aria-label` (icon-only), `aria-busy` (pending)
- Toast: `role="status"`, `aria-live="polite"`

### Focus

- Po delete: focus nast�pna karta
- Po submit edit: focus saved description
- Modal: focus trap, Esc zamyka

### Keyboard

- Tab order: filtry karty akcje
- Enter: submit edit, confirm delete
- Esc: cancel edit, close modal

## 15. State management details

- `useEventsFilters`: useState + useSearchParams + useDebounce(300ms) + useEffect sync URL
- `useEventMutations`: onMutate update cache, onError rollback, onSuccess invalidateQueries
- `useInfiniteEventsQuery`: Key `['events', { saved: true, ...filters }]`, getNextPageParam, select flatMap

## 16. Error handling

### API errors

- **400**: toast + inline error
- **401/403**: toast "Sesja wygasła" + redirect
- **404**: toast + usuń lokalnie
- **500/503**: toast + retry

### Categories fetch error

- GET /api/categories/\* fail: fallback puste listy `[]`, toast z retry, cache 1h

### Network

- Timeout: 30s + AbortController
- Offline: toast "Brak połączenia"
- Retry: queries 1, mutations 0

### Optimistic failures

Rollback cache + toast + czerwona ramka 2s

### Clipboard fallback

Modal z textarea + "Skopiuj ręcznie (Ctrl+C)"

## 17. Performance

- `React.memo()`: EventCard, InlineEditArea, RatingButtons, CopyButton
- `useCallback`: handlers w EventsPage
- `useMemo`: mapEventToViewModel, availability logic
- Debounce: filtry 300ms, edit submit 500ms

## 18. Testing

### Manual test scenarios (zgodnie z docs/manual-tests/)

- Filtrowanie po kategorii → sprawdź URL sync + refetch
- Zmiana sortowania → sprawdź kierunek + update listy
- Edycja opisu → zapis → toast + aktualizacja karty
- Edycja opisu → anulowanie → rollback
- Ocena wydarzenia → sprawdź lock drugiego przycisku
- Usuń wydarzenie → modal → potwierdź → usunięcie karty + toast
- Infinite scroll → dojdź do końca → fallback "Wczytaj więcej"
- Session expiry → toast + redirect `/login`
- Błąd 500 → ErrorBoundary + przycisk retry
- Pobieranie kategorii fail → fallback puste listy + retry

### Unit tests (opcjonalne)

- `mapEventToViewModel`: poprawność mapowania + formatowanie daty
- `useEventsFilters`: URL sync + debounce
- `useEventMutations`: optimistic updates + rollback

### Edge cases

- Pusta lista po filtrach → EmptyState
- Edycja podczas delete → disabled prevent
- Concurrent mutations → blokada/kolejkowanie
- Backend >500 znaków → truncate + warning badge
