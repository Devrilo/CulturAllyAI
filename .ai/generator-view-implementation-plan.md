# Plan implementacji widoku Generator

## 1. Przegląd

Widok Generator umożliwia użytkownikowi (gościowi lub zalogowanemu) wprowadzenie danych wydarzenia, wywołanie generowania opisu przez AI, kopiowanie treści, zapisywanie opisów oraz ocenianie ich trafności. Interfejs musi pozostać w języku polskim, zapewniać szybkie sprzężenie zwrotne, walidację czasu rzeczywistego oraz jasną separację funkcji dostępnych wyłącznie po zalogowaniu.

## 1A. Design decisions

### Middleware i routing

- Widok `/` jest publiczny (brak middleware protection), dostępny dla gości i zalogowanych
- Middleware `src/middleware/index.ts` sprawdza session i przekazuje `supabase` do `Astro.locals`
- Session refresh automatyczny (Supabase SDK), brak manualnej implementacji

### Concurrent requests

- Debounce 300ms na przyciskach akcji (prevent double-click)
- AbortController dla POST /api/events - anulowanie poprzedniego żądania przy retry
- Disabled state na wszystkich akcjach podczas pending mutation

### Session expiry

- `useSupabaseSession` nasłuchuje `onAuthStateChange` - auto-detect wygaśnięcia
- Przy 401: toast + ukrycie auth-only UI + `AuthPromptBanner`
- Brak auto-redirect (user może kontynuować jako guest)

### Generated description >500 znaków

- Backend gwarantuje ≤500 (truncate w AI service)
- Frontend: defensywnie sprawdź `.slice(0, 500)` przy display
- Toast warning jeśli wykryto przekroczenie

### Backend zwraca opis >500 znaków (edge case)

- Display pierwsze 500 + badge "Opis został skrócony"
- Nie blokuj zapisu - user może edytować

## 2. Routing widoku

Widok jest dostępny pod ścieżką `/` i renderowany przez plik `src/pages/index.astro`, który montuje nadrzędny komponent React `GeneratorPage`.

## 3. Struktura komponentów

- `GeneratorPage`
  - `Header` (z przyciskiem „Wyloguj” dla zalogowanych)
  - `AuthPromptBanner`
  - `GeneratorLayout`
    - `EventForm`
      - `FormField` (×6, pola wejściowe + walidacja, liczniki znaków)
    - `DescriptionPanel`
      - `DescriptionPreview`
        - `LoadingSkeleton` / `GeneratedDescription`
          - `DescriptionMeta`
          - `ActionButtons`
            - `GenerateButton`
            - `SaveButton`
            - `CopyButton`
          - `RatingButtons`
      - `TimeoutNotice`
  - `ToastViewport`

## 4. Szczegóły komponentów

### GeneratorPage

- **Opis:** Nadrzędna logika widoku; pobiera kategorie, sprawdza sesję Supabase, orkiestruje stan formularza i zdarzeń.
- **Główne elementy:** `Header`, `AuthPromptBanner`, `GeneratorLayout`, provider dla React Query / Toastów.
- **Obsługiwane interakcje:** inicjalizacja danych (`useQuery`), obsługa wylogowania (`signOut`), przekazywanie callbacków generowania/zapisu/oceny.
- **Obsługiwana walidacja:** brak bezpośredniej – deleguje do `EventForm`.
- **Typy:** `EventCategoriesResponseDTO`, `AgeCategoriesResponseDTO`, `CreateEventDTO`, `EventResponseDTO`, `UpdateEventDTO`, `GeneratorViewState` (nowy), `AuthState` (nowy).
- **Propsy:** brak (komponent montowany z poziomu strony).

### Header

- **Opis:** Pasek górny z logotypem oraz akcjami konta; prezentuje przyciski logowania/wylogowania zgodnie z sesją.
- **Główne elementy:** `nav` z przyciskiem `Wyloguj` (`Button` Shadcn) lub linkiem „Zaloguj się”.
- **Obsługiwane interakcje:** kliknięcie `Wyloguj` → `signOut` z Supabase, przekierowanie na `/login`.
- **Obsługiwana walidacja:** brak.
- **Typy:** `AuthState`.
- **Propsy:** `{ authState: AuthState; onSignOut: () => Promise<void>; }`.

### AuthPromptBanner

- **Opis:** Komponent informacyjny zachęcający gości do logowania, gdy dostępne są funkcje wymagające konta.
- **Główne elementy:** `aside` z ikoną i linkiem `Zaloguj się`, kondycjonalnie renderowany.
- **Obsługiwane interakcje:** kliknięcie linku → nawigacja do `/login`.
- **Obsługiwana walidacja:** brak.
- **Typy:** `AuthState`.
- **Propsy:** `{ authState: AuthState; }`.

### GeneratorLayout

- **Opis:** Layout dwukolumnowy (formularz + panel opisu) z responsywnym układem i przerwami.
- **Główne elementy:** `section` z grid/flex, zawiera `EventForm` i `DescriptionPanel`.
- **Obsługiwane interakcje:** brak; odpowiada za layout i przekazywanie propsów.
- **Obsługiwana walidacja:** brak.
- **Typy:** `GeneratorViewState`, `EventFormValues`, `GeneratedEventViewModel`.
- **Propsy:** `{ formState: EventFormState; onFormChange: (values: EventFormValues) => void; ... }` (pełna lista w implementacji).

### EventForm

- **Opis:** Formularz z polami wejściowymi (tytuł, data, miasto, kategoria, kategoria wiekowa, najważniejsze informacje) z walidacją inline i licznikami znaków.
- **Główne elementy:** `form` z `FormField` (Input/Select/Textarea z Tailwind + Shadcn), `CharacterCounter`, `FormHelperText` (dla błędów), `Button` (opcjonalne).
- **Obsługiwane interakcje:** `onSubmit` (wywołuje generowanie), `onChange` (aktualizacja `formValues`), walidacja onBlur/onInput.
- **Obsługiwana walidacja:** wymagane pola (wszystkie), `key_information` ≤ 200 znaków, format daty ISO, wybór kategorii/age z listy, brak pustych wartości. Dodatkowo można walidować długość tytułu/miasta (zgodność z ograniczeniami backendu, jeśli istnieją w schemacie Zod – sprawdzić `createEventSchema`).
- **Typy:** `EventFormValues` (nowy), `EventFormErrors` (nowy), `EventCategoryDTO`, `AgeCategoryDTO`.
- **Propsy:** `{ values: EventFormValues; errors: EventFormErrors; onChange: (values) => void; onSubmit: () => void; disabled: boolean; categories: EventCategoryDTO[]; ageCategories: AgeCategoryDTO[]; }`.

### DescriptionPanel

- **Opis:** Kontener na podgląd opisu, przyciski akcji i komunikaty o stanie.
- **Główne elementy:** `article` z `DescriptionPreview`, `TimeoutNotice`, sekcją statusów.
- **Obsługiwane interakcje:** propagacja akcji z przycisków (`generate`, `save`, `copy`, `rate`).
- **Obsługiwana walidacja:** brak.
- **Typy:** `GeneratedEventViewModel`, `GeneratorStatus` (nowy).
- **Propsy:** `{ generated: GeneratedEventViewModel | null; status: GeneratorStatus; isAuthenticated: boolean; onGenerate: () => void; onSave: () => void; onCopy: () => void; onRate: (value: Feedback) => void; }`.

### DescriptionPreview

- **Opis:** Wyświetla opis (wygenerowany lub edytowany), metadane (data, miasto, kategorie), liczniki znaków oraz informuje o stanie (zapisywanie, ocena, skeleton podczas ładowania).
- **Główne elementy:** `div` z warstwami `LoadingSkeleton` / `p` opis, `DescriptionMeta`, `CharacterCounter`, `StatusBadge`.
- **Obsługiwane interakcje:** edycja opisu (opcjonalna textarea na późniejszy etap), start przycisków (deleguje do `ActionButtons`).
- **Obsługiwana walidacja:** limit 500 znaków przy ewentualnej edycji (`edited_description`).
- **Typy:** `GeneratedEventViewModel`, `GeneratorStatus`.
- **Propsy:** `{ generated: GeneratedEventViewModel | null; status: GeneratorStatus; showSkeleton: boolean; }`.

### ActionButtons

- **Opis:** Zestaw przycisków „Generuj opis”, „Zapisz”, „Kopiuj”, sterujący dostępnością w zależności od stanu i autoryzacji.
- **Główne elementy:** `div` z trzema przyciskami Shadcn, ikonami Lucide (`Sparkles`, `Bookmark`, `Copy`).
- **Obsługiwane interakcje:** kliknięcia generowania (wywołanie POST), zapisywania (PATCH saved=true), kopiowania (Clipboard API + toast).
- **Obsługiwana walidacja:** blokuje `Generuj` jeśli formularz niepoprawny; `Zapisz` tylko dla zalogowanych i gdy istnieje event; `Kopiuj` dostępne po wygenerowaniu.
- **Typy:** `GeneratorStatus`, `ActionAvailability` (nowy).
- **Propsy:** `{ status: GeneratorStatus; availability: ActionAvailability; onGenerate: () => void; onSave: () => void; onCopy: () => void; }`.

### RatingButtons

- **Opis:** Przyciski oceny (kciuk w górę/dół) dla aktualnego opisu.
- **Główne elementy:** `Button` w wariancie ikonowym z ikonami `ThumbsUp`, `ThumbsDown` (Lucide), wskaźnik aktywacji (kolor #16a34a / #dc2626).
- **Obsługiwane interakcje:** kliknięcie oceny → `onRate(feedback)` z `thumbs_up`/`thumbs_down`, dezaktywacja po wyborze.
- **Obsługiwana walidacja:** przycisk dostępny tylko po wygenerowaniu, brak ponownej oceny (zablokowany, tooltip z informacją).
- **Typy:** `Feedback` (DTO), `RatingState` (nowy).
- **Propsy:** `{ ratingState: RatingState; disabled: boolean; onRate: (feedback: Feedback) => void; }`.

### TimeoutNotice

- **Opis:** Komponent informujący o przedłużającym się generowaniu (>10 s) z możliwością ponowienia.
- **Główne elementy:** `Alert` z ikoną `Timer`, tekstem i przyciskiem „Spróbuj ponownie”.
- **Obsługiwane interakcje:** kliknięcie przycisku → ponowne wywołanie `onRetry`.
- **Obsługiwana walidacja:** brak.
- **Typy:** `GeneratorStatus`.
- **Propsy:** `{ visible: boolean; onRetry: () => void; }`.

### ToastViewport

- **Opis:** Kontener Shadcn Toast; odpowiada za prezentację komunikatów („Skopiowano”, „Zapisano”, błędy API).
- **Główne elementy:** `Toast` (success/error/info) z autowymykaniem 2 s.
- **Obsługiwane interakcje:** zamykanie toastów.
- **Obsługiwana walidacja:** brak.
- **Typy:** Wewnętrzne typy Shadcn.
- **Propsy:** brak (umieszczony w `GeneratorPage`).

## 5. Typy

- `EventFormValues`: `{ title: string; event_date: string; city: string; category: EventCategory; age_category: AgeCategory; key_information: string; }`.
- `EventFormErrors`: mapa `Partial<Record<keyof EventFormValues, string>>` + `form?: string`.
- `GeneratorViewState`: `{ form: EventFormValues; errors: EventFormErrors; generated: GeneratedEventViewModel | null; status: GeneratorStatus; auth: AuthState; availability: ActionAvailability; rating: RatingState; }`.
- `GeneratedEventViewModel`: `{ id: string; title: string; city: string; event_date: string; categoryLabel: string; ageCategoryLabel: string; key_information: string; description: string; saved: boolean; feedback: Feedback | null; createdByAuthenticated: boolean; updatedAt: string; }` (mapowane z `EventResponseDTO`).
- `AuthState`: `{ isAuthenticated: boolean; userId: string | null; status: "loading" | "ready" | "error"; }`.
- `GeneratorStatus`: `{ isGenerating: boolean; isSaving: boolean; isCopying: boolean; errorCode?: string; lastSuccessAt?: number; timeoutElapsed: boolean; }`.
- `ActionAvailability`: `{ canGenerate: boolean; canSave: boolean; canCopy: boolean; canRate: boolean; }`.
- `RatingState`: `{ current: Feedback | null; locked: boolean; }`.
- `CategoriesQueryData`: alias `EventCategoryDTO[]`.
- `AgeCategoriesQueryData`: alias `AgeCategoryDTO[]`.

### Mapowanie EventResponseDTO → GeneratedEventViewModel

```typescript
function mapEventResponse(
  event: EventResponseDTO,
  categories: CategoriesQueryData,
  ageCategories: AgeCategoriesQueryData
): GeneratedEventViewModel {
  return {
    id: event.id,
    title: event.title,
    city: event.city,
    event_date: event.event_date,
    categoryLabel: categories.find((c) => c.value === event.category)?.label ?? event.category,
    ageCategoryLabel: ageCategories.find((c) => c.value === event.age_category)?.label ?? event.age_category,
    key_information: event.key_information,
    description: event.edited_description || event.generated_description,
    saved: event.saved,
    feedback: event.feedback,
    createdByAuthenticated: event.created_by_authenticated_user,
    updatedAt: event.updated_at,
  };
}
```

## 6. Zarządzanie stanem

- Użycie React Query do pobierania kategorii (`useQuery` z cache 1h) i ewentualnie do mutacji (generate/save/rate) z `useMutation`.
- Lokalny stan formularza w `useReducer` lub `useState` z walidacją onChange; preferowany custom hook `useEventForm` zwracający `values`, `errors`, `updateField`, `validateAll`, `isValid`.
- Stan generowania (`GeneratorStatus`) kontrolowany przez custom hook `useGeneratorFlow` obsługujący mutacje, timeout (timer 10 s) oraz synchronizację akcji `save`, `rate`, `copy`.
- Autoryzacja: hook `useSupabaseSession` (jeśli brak – utworzyć) monitorujący sesję i automatyczne przekierowania.
- Toasty: `useToast` (Shadcn).

## 7. Integracja API

- `GET /api/categories/events` → wstępne pobranie kategorii; typ odpowiedzi `EventCategoriesResponseDTO`.
- `GET /api/categories/age` → analogicznie dla kategorii wiekowych; typ `AgeCategoriesResponseDTO`.
- `POST /api/events` → mutacja generująca opis; request body `CreateEventDTO`, response `EventResponseDTO` (mapowane do `GeneratedEventViewModel`). Obsługa statusów 400, 401, 500, 503.
- `PATCH /api/events/:id` → mutacja oznaczająca zapis (`{ saved: true }`) lub ocenę (`{ feedback: 'thumbs_up' | 'thumbs_down' }`). Odpowiedź `EventResponseDTO`. Dla gościa zwróci 403 przy próbie zapisu/oceny.
- Supabase Auth SDK → `getSession`, `signOut`.

## 8. Interakcje użytkownika

- Wprowadzanie danych w formularzu → natychmiastowa walidacja i aktualizacja liczników znaków.
- Kliknięcie „Generuj opis” → walidacja, POST, skeleton + spinner + blokada pól, po sukcesie aktualizacja preview i odblokowanie.
- Kliknięcie „Zapisz” (tylko zalogowani) → PATCH `saved=true`, potwierdzenie toasty, zmiana statusu przycisku na „Zapisane”.
- Kliknięcie „Kopiuj” → Clipboard API, toast „Skopiowano do schowka”.
- Kliknięcie „Kciuk w górę/dół” → PATCH `feedback`, przycisk zostaje zablokowany, kolor podświetla wybór.
- Generowanie >10 s → pojawia się `TimeoutNotice` z opcją ponowienia.
- Otrzymanie błędu 401 przy akcji → toast + przekierowanie/wyświetlenie bannera logowania.
- Wylogowanie z nagłówka → `signOut`, redirect na `/login`.

## 9. Warunki i walidacja

- Formularz nie pozwala na wysłanie pustych pól; daty w formacie ISO (`YYYY-MM-DD`).
- `key_information` max 200 znaków; licznik czerwony przy przekroczeniu.
- Oczekiwanie na `generated.description` ≤ 500 znaków; w razie przekroczenia (teoretycznie) – przyciąć i oznaczyć ostrzeżeniem.
- Przyciski `Zapisz`, `Oceń` aktywne tylko dla `authState.isAuthenticated` i gdy `generated` istnieje z `createdByAuthenticated=true`.
- Blokada ponownej oceny / zapisu (flagowanie `locked` w `RatingState`, `saved=true`).
- Timeout >10 s oznacza `status.timeoutElapsed=true`, blokada generowania do czasu decyzji użytkownika.

## 10. Obsługa błędów

- 400: wyświetlić toast z listą błędów + mapowanie do pól formularza.
- 401: toast i wyświetlenie `AuthPromptBanner`; zablokować akcje wymagające logowania.
- 403: toast z informacją o ograniczeniu gościa (przy próbie zapisu/oceny).
- 404: w teorii brak na tym widoku (chodzi o `PATCH` na nieistniejący event) – pokazać toast i zresetować stan.
- 500/503: toast z możliwością ponowienia; `TimeoutNotice` / modal retry zgodny z planem UX.
- Błąd Clipboard: toast błędu i podpowiedź manualna.
- Błąd sieci: toast + zachowanie poprzedniego stanu, przyciski w stanie ponowienia.

## 11. Kroki implementacji

1. Skonfiguruj stronę `src/pages/index.astro`, importując `GeneratorPage` oraz providery (React Query, Theme, Toast).
2. Utwórz typy view-modeli (`src/types.ts` lub `src/components/generator/types.ts`), w tym `EventFormValues`, `GeneratedEventViewModel`, `GeneratorStatus` itp.
3. Zaimplementuj hook `useSupabaseSession` (jeśli brak) i `useEventForm` w `src/components/hooks`.
4. Zaimplementuj `useGeneratorFlow` (mutacje, timeout, toast integration) w `src/components/hooks`.
5. Utwórz strukturę komponentów w `src/components/generator/` (np. `GeneratorPage.tsx`, `EventForm.tsx`, `DescriptionPanel.tsx`, `ActionButtons.tsx`, `RatingButtons.tsx`, `AuthPromptBanner.tsx`, `TimeoutNotice.tsx`).
6. Dodaj obsługę pobierania kategorii (React Query) oraz mapowanie odpowiedzi do etykiet.
7. Zaimplementuj walidację formularza (inline, char counters) i blokowanie przycisków podczas mutacji.
8. Zaimplementuj POST `/api/events` z obsługą skeletonu, spinnera, timeoutu oraz mapowaniem odpowiedzi do `GeneratedEventViewModel`.
9. Dodaj `PATCH /api/events/:id` dla akcji zapisu i oceny, wraz z blokadą wielokrotnej interakcji.
10. Zaimplementuj przycisk „Kopiuj" z Clipboard API i toastem potwierdzającym.
11. Dodaj obsługę błędów i toastów dla wszystkich akcji (w tym 401/403/500/503, fallback logowania) oraz testy manualne zgodnie z planami w `docs/manual-tests/`.

## 12. Konfiguracja techniczna

### 12.1 Integracja Astro + React

- Strona `src/pages/index.astro` używa `Layout.astro` i montuje `<GeneratorPage client:load />`
- Meta: `<title>Generator Opisów Wydarzeń | CulturAllyAI</title>`
- Providery w `GeneratorPage`: QueryClientProvider, Toaster (Shadcn)

### 12.2 Supabase w React

- Przekazać klienta przez props: w `index.astro` → `const supabase = Astro.locals.supabase` → `<GeneratorPage supabase={supabase} />`
- Typ: `SupabaseClient` z `src/db/supabase.client.ts`
- Session sprawdzana przez `supabase.auth.getSession()` w `useEffect`

### 12.3 React Query setup

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 3600000, retry: 1 },
    mutations: { retry: false },
  },
});
```

### 12.4 Walidacja Zod

- Użyj `createEventSchema` z `src/lib/validators/events.ts` po stronie frontendu
- Walidacja: onChange (debounce 300ms) + onSubmit
- Komunikaty błędów inline pod polami (aria-describedby)

### 12.5 Shadcn components

Zainstalowane: Button, Input, Textarea, Select, Label, Toast, Alert, Skeleton

- Custom colors w tailwind.config: `--success: #16a34a`, `--error: #dc2626`
- Ikony z `lucide-react`: Sparkles, Bookmark, BookmarkCheck, Copy, ThumbsUp, ThumbsDown, Timer

### 12.6 Utility libraries

- `usehooks-ts` dla `useDebounce`, `useLocalStorage` (opcjonalnie)
- `date-fns` dla formatowania daty (opcjonalnie, można używać Intl.DateTimeFormat)
- Lub implementacja custom `useDebouncedCallback` jeśli chcesz uniknąć dependencies

## 13. Specyfikacja UI/UX

### 13.1 Responsive layout

- **Mobile (<640px)**: stack vertical, formularz nad preview
- **Desktop (≥1024px)**: grid 2 kolumny (1fr 1fr), gap-8
- Font: text-base (16px), headings text-xl/2xl

### 13.2 Pola formularza

- **Tytuł**: `<Input type="text" maxLength={100} placeholder="np. Koncert Chopina" />`
  - Label: "Tytuł wydarzenia"
- **Data**: `<Input type="date" min={today} />` (native date picker)
  - Label: "Data wydarzenia"
  - `today = new Date().toISOString().split('T')[0]`
- **Miasto**: `<Input type="text" placeholder="np. Warszawa" />`
  - Label: "Miasto", description: "Gdzie?"
- **Kategoria**: `<Select>` z options z API
  - Label: "Kategoria wydarzenia"
  - Placeholder: "Wybierz kategorię"
- **Kategoria wiekowa**: `<Select>` z options z API
  - Label: "Kategoria wiekowa", description: "Dla kogo?"
  - Placeholder: "Wybierz grupę wiekową"
- **Najważniejsze informacje**: `<Textarea rows={4} maxLength={200} />`
  - Label: "Najważniejsze informacje"
  - Placeholder: "Opisz kluczowe szczegóły wydarzenia..."

### 13.3 Character counters

- Format: `"150 / 200"`, kolor: text-muted-foreground, czerwony gdy >90%
- Pozycja: absolute right-2 bottom-2 w relative container

### 13.4 Loading states

- **Skeleton**: 5 linii (h-4, bg-muted, animate-pulse), gap-2
- **Spinner**: w centrum preview, 32px, obok tekstu "Generowanie opisu..."
- **Formularz disabled**: wszystkie pola opacity-50, cursor-not-allowed

### 13.5 Przyciski

- **Generuj**: primary, Sparkles icon, disabled gdy form invalid lub isGenerating
  - Pozycja: poniżej formularza lub w DescriptionPanel header
  - Text: "Generuj opis" (desktop), tylko ikona (mobile optional)
- **Zapisz**: outline, Bookmark/BookmarkCheck icon, disabled dla gości lub gdy saved=true, label zmienia się na "Zapisane"
  - Tooltip dla disabled (guest): "Zaloguj się, aby zapisać"
- **Kopiuj**: ghost, Copy icon, absolute top-2 right-2 w preview, toast 2s "Skopiowano"
- **Ocena**: ghost, kolory fill po wyborze (green-600/red-600), disabled po ocenie, tooltip "Już ocenione"
  - Size: icon button sm, gap-2 między kciukami

### 13.6 Toast messages

- Pozycja: top-right
- Typy: success (green), error (red), info (blue)
- Auto-close: 2s (success), 5s (error), dismissable
- Teksty:
  - "Skopiowano do schowka" (success)
  - "Wydarzenie zapisane" (success)
  - "Dziękujemy za ocenę" (success)
  - "Zaloguj się, aby zapisać wydarzenie" (info)
  - "Wystąpił błąd. Spróbuj ponownie." (error)
  - "Sesja wygasła. Zaloguj się ponownie." (error)

### 13.7 TimeoutNotice

- Alert variant="warning", ikona Timer
- Tekst: "Generowanie trwa dłużej niż zwykle. Możesz poczekać lub spróbować ponownie."
- Przycisk "Spróbuj ponownie" → abort previous request, nowy POST

### 13.8 AuthPromptBanner

- Pokazywane: tylko dla gości po próbie zapisu/oceny (nie od razu)
- Alert variant="info", dismissable
- Tekst: "Zaloguj się, aby zapisywać i oceniać wydarzenia"
- Link: "Zaloguj się" → `/login`
- State tracking: `showBanner` (local state), dismiss → `setShowBanner(false)`, nie persist (pojawi się przy następnej próbie)

### 13.9 Animacje i transitions

- Form fields: `transition-colors duration-200` dla focus/hover
- Buttons: `transition-all duration-150` + `active:scale-95`
- Toast: slide-in z prawej (`@keyframes slideIn`), fade-out przy zamykaniu
- Skeleton: `animate-pulse` (Tailwind)
- Preview content: `transition-opacity duration-300` przy zmianie stanu (loading → loaded)

## 14. Accessibility (ARIA)

### 14.1 Kluczowe atrybuty

- Form: `role="form"`, `aria-label="Formularz tworzenia wydarzenia"`
- Inputs: `aria-invalid={!!error}`, `aria-describedby={errorId}` gdy błąd
- Preview: `role="region"`, `aria-label="Podgląd opisu wydarzenia"`, `aria-live="polite"` dla statusów
- Przyciski: `aria-label` gdy tylko ikona, `aria-busy` podczas akcji
- Toast: `role="status"`, `aria-live="polite"`

### 14.2 Focus management

- Po wygenerowaniu: focus na preview (scrollIntoView, smooth)
- Po błędzie: focus na pierwszy błędny input
- Modals/alerts: focus trap, Esc zamyka

### 14.3 Keyboard navigation

- Tab order: formularz → Generuj → preview → akcje (Zapisz/Kopiuj/Ocena)
- Enter w formularzu → submit (generuj)
- Space/Enter na przyciskach

## 15. State management details

### 15.1 Custom hooks

**useEventForm:**

```typescript
// Zwraca: { values, errors, updateField, validateAll, isValid, reset }
// Walidacja: debounced onChange (300ms) + immediate onSubmit
// Używa createEventSchema z Zod
// Implementacja:
// - useState dla values + errors
// - useDebouncedCallback (300ms) dla validateField
// - validateAll: synchronicznie z safeParse, mapuj errors
```

**useGeneratorFlow:**

```typescript
// Zarządza: mutations (POST/PATCH), timeout tracking (setTimeout 10s)
// Zwraca: { generate, save, rate, copy, status: GeneratorStatus }
// Timeout: ustawia timeoutElapsed=true po 10s, pokazuje TimeoutNotice
// Implementacja:
// - useMutation dla POST/PATCH z React Query
// - useRef dla AbortController i timeoutId
// - cleanup w useEffect return
// - copy: navigator.clipboard.writeText + toast
```

**useSupabaseSession:**

```typescript
// Zwraca: { session, userId, isAuthenticated, status: 'loading'|'ready'|'error' }
// Nasłuchuje: supabase.auth.onAuthStateChange
// Auto-refresh: tak (SDK handle)
// Implementacja:
// - useState dla session + status
// - useEffect: supabase.auth.getSession() + onAuthStateChange listener
// - cleanup: unsubscribe w return
```

### 15.2 React Query keys

- `['categories', 'events']` → GET /api/categories/events
- `['categories', 'age']` → GET /api/categories/age
- Mutations: nie cachować, tylko callbacks (onSuccess → update local state)

### 15.3 Form persistence

- **Brak** localStorage/sessionStorage w MVP
- Reset formularza: po udanym zapisie (opcjonalne) lub manualnie przez użytkownika

## 16. Error handling scenarios

### 16.1 API errors

- **400**: mapuj `details[]` do `errors` per field, toast ogólny
- **401**: toast "Sesja wygasła", ukryj przyciski auth-only, pokaż AuthPromptBanner
- **403**: toast "Brak uprawnień" (guest próbował zapisać)
- **404**: toast "Wydarzenie nie znaleziono", reset state
- **500/503**: toast z retry, TimeoutNotice, nie resetuj formularza

### 16.2 Network errors

- Retry logic: React Query retry: 1 dla queries, 0 dla mutations
- Offline: toast "Brak połączenia", disable akcje
- Timeout: AbortController z timeout 30s dla POST

### 16.3 Validation errors

- Display inline pod inputem, red border, aria-invalid
- Blokuj submit gdy isValid=false

### 16.4 Clipboard fallback

- Jeśli API fail: pokaż modal z textarea + "Skopiuj ręcznie (Ctrl+C)"

### 16.5 Error display patterns

- **Inline field errors**: text-sm text-destructive, id=`{fieldName}-error`, linked via aria-describedby
- **Toast errors**: max 1 error toast na raz (dismiss poprzedni), button "Zamknij" + auto-close
- **Form-level errors** (nieoczekiwane): Alert nad formularzem, sticky do góry, dismissable

## 17. Performance optimizations

- `React.memo()`: EventForm, DescriptionPreview, ActionButtons, RatingButtons
- `useCallback`: wszystkie event handlers przekazywane do children
- `useMemo`: mapowanie kategorii (value→label), availability logic
- Debounce: walidacja (300ms), character counters (150ms)
- Code splitting: nie potrzebne w MVP (mały bundle)

## 17A. Testing considerations

### Kluczowe scenariusze do manual testów

- Guest flow: wypełnienie → generowanie → próba zapisu (AuthPromptBanner)
- Authenticated flow: wypełnienie → generowanie → zapis → ocena
- Walidacja: puste pola, przekroczone limity (200/500 znaków)
- Timeout: mock delay >10s, TimeoutNotice, retry
- Errors: 400 (mapowanie do pól), 401 (session expiry), 500 (retry)
- Clipboard: sukces + fallback modal
- Responsywność: mobile stack, desktop grid

### Edge cases

- Zmiana formularza podczas generowania (disabled prevent)
- Wielokrotne kliknięcie Generuj (debounce)
- Backend opis >500 znaków (truncate + badge)
- Kategorie fail to load (retry + error state)

## 18. Kroki implementacji

1. **Setup infrastruktury:**
   - Skonfiguruj `src/pages/index.astro` z Layout i przekazaniem supabase do React
   - Zainstaluj brakujące Shadcn components: `npx shadcn@latest add input textarea select label alert skeleton`
   - Dodaj typy do `src/types.ts` lub `src/components/generator/types.ts`

2. **Custom hooks:**
   - `src/components/hooks/useSupabaseSession.ts`
   - `src/components/hooks/useEventForm.ts` z Zod validation
   - `src/components/hooks/useGeneratorFlow.ts` z mutations i timeout

3. **Podstawowe komponenty:**
   - `src/components/generator/GeneratorPage.tsx` z providers
   - `src/components/generator/EventForm.tsx` z polami i walidacją
   - `src/components/generator/DescriptionPanel.tsx` z preview

4. **Komponenty akcji:**
   - `src/components/generator/ActionButtons.tsx`
   - `src/components/generator/RatingButtons.tsx`
   - `src/components/generator/AuthPromptBanner.tsx`
   - `src/components/generator/TimeoutNotice.tsx`

5. **Integracja API:**
   - React Query queries dla kategorii
   - Mutations dla POST /api/events i PATCH /api/events/:id
   - Error handling i toast notifications

6. **Finalizacja:**
   - Accessibility audit (ARIA, keyboard, screen reader)
   - Responsive testing (mobile/tablet/desktop)
   - Manual tests zgodnie z `docs/manual-tests/generate-event-manual-test-plan.md`
