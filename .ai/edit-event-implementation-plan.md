# API Endpoint Implementation Plan: Update Event

## 1. Przegląd punktu końcowego

- Aktualizuje pola `saved`, `feedback`, `edited_description` istniejącego wydarzenia stworzonego przez zalogowanego użytkownika.
- Respektuje ograniczenia tabeli `events`, w tym brak możliwości edycji wydarzeń gości oraz limit 500 znaków na opis.
- Utrzymuje spójność audytu poprzez wpisy w `event_management_logs` (akcje `event_saved`, `event_edited`).

## 2. Szczegóły żądania

- Metoda HTTP: `PATCH`
- Ścieżka: `/api/events/:id`
- Nagłówki: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Parametry:
  - Wymagane: `id` (UUID w ścieżce)
  - Opcjonalne w body: `saved` (boolean), `feedback` (`thumbs_up` | `thumbs_down` | null), `edited_description` (string ≤ 500 lub null)
- Walidacja requestu:
  - Użyć nowego `updateEventSchema` (Zod) z `z.object({...}).partial().refine(...)` wymuszającego co najmniej jedno pole.
  - `edited_description`: trim, odrzuć puste łańcuchy (konwertuj do null) i sprawdź limit znaków.
  - `feedback`: walidacja względem `Constants.public.Enums.feedback`.
  - `saved`: boolean; dodatkowo w runtime upewnić się, że gość nie ustawia `true`.
- DTO & Command modele:
  - `UpdateEventDTO` (istnieje) – wejście handlera.
  - Nowy `UpdateEventCommand` (`eventId`, `userId`, `payload`, `previousEvent`) używany w serwisie.

## 3. Szczegóły odpowiedzi

- Sukces 200: `EventResponseDTO` (pełny rekord po aktualizacji, w tym `updated_at`).
- Błędy:
  - 400: `ErrorResponseDTO` z `details` dla błędów walidacji lub pustego body.
  - 401: `ErrorResponseDTO` gdy token brak/niepoprawny.
  - 403: `ErrorResponseDTO` gdy `created_by_authenticated_user = false` lub naruszenie ograniczeń biznesowych.
  - 404: `ErrorResponseDTO` gdy rekord nie istnieje lub nie należy do użytkownika.
  - 500: `ErrorResponseDTO` w przypadku błędów Supabase/nieoczekiwanych wyjątków.
- Wszystkie odpowiedzi JSON z nagłówkiem `Content-Type: application/json`.

## 4. Przepływ danych

1. Handler odczytuje JSON, obsługuje wyjątek dla nieprawidłowego JSON (400).
2. Walidacja Zod na body, w razie błędów mapowanie do `ValidationErrorDTO[]`.
3. Supabase auth: `locals.supabase.auth.getUser()` – brak tokena → 401; niepowodzenie z tokenem → 401.
4. Budowa `UpdateEventCommand` (eventId z param, userId z tokena, payload z walidacji).
5. Serwis `updateEvent`:
   - Pobranie rekordu `events` przez `id` i `user_id` (zastosować `.eq("id", eventId).eq("user_id", userId).single()`).
   - Walidacje biznesowe: wydarzenie gościa, brak zmian, ograniczenie CHECK (np. `saved=true` tylko dla authenticated).
   - Przygotowanie obiektu aktualizacji (tylko pola z realną zmianą, trim + null dla pustych opisów).
   - Wykonanie `.update().eq("id", eventId).select().single()`.
   - Logowanie w `event_management_logs`:
     - `event_saved` gdy zmienia się wartość `saved`
     - `event_rated` gdy zmienia się wartość `feedback`
     - `event_edited` gdy zmienia się wartość `edited_description`
6. Serwis zwraca zaktualizowany rekord; handler mapuje na 200.
7. Błędy serwisu propagowane jako `EventServiceError` z kodem/status – handler mapuje na HTTP.

## 5. Względy bezpieczeństwa

- Autoryzacja wyłącznie przez ważny token Supabase (Bearer), brak obsługi gości.
- Podwójna kontrola własności (`user_id` + RLS) zapewnia brak wycieku danych (nawet jeśli RLS zmieni się w przyszłości).
- Blokada na `created_by_authenticated_user = false` zapobiega eskalacji uprawnień gości.
- Normalizacja danych wejściowych (trim, null) ogranicza ryzyko przepełnień i injection.
- Brak ekspozycji wewnętrznych błędów Supabase lub stack trace w odpowiedziach.

## 6. Obsługa błędów

- Klasyfikacja błędów w serwisie przy pomocy `EventServiceError` z kodami (`EVENT_NOT_FOUND`, `GUEST_EVENT_UPDATE_FORBIDDEN`, `NO_FIELDS_TO_UPDATE`, `UPDATE_FAILED`).
- Handler tłumaczy kody na statusy HTTP zgodne ze specyfikacją.
- Nieudane wpisy do `event_management_logs` logowane na `console.error`, ale nie przerywają głównej operacji.
- Niespodziewane wyjątki łapane w handlerze → log + 500 z generyczną treścią.

## 7. Wydajność

- Jednokrotne zapytanie SELECT + UPDATE na indeksowanych kolumnach (`id`, `user_id`).
- Brak dodatkowych obciążeń AI – tylko operacja DB.
- Ograniczenie aktualizacji do zmienionych pól minimalizuje write amplification.
- Możliwość dodania testów regresyjnych pod kątem blokad (opcjonalnie w przyszłości z upsert).

## 8. Kroki implementacji

1. Rozszerzyć `src/lib/validators/events.ts` o `updateEventSchema` i eksport typu `UpdateEventInput`.
2. W `src/lib/services/events.service.ts` dodać `UpdateEventCommand`, `UpdateEventResult`, `updateEvent` wraz z logiką walidacji biznesowej i logowaniem akcji.
3. Utworzyć plik `src/pages/api/events/[id].ts` (jeśli brak) z handlerem `PATCH` bazującym na istniejących wzorcach (obsługa JSON, walidacja, auth, mapowanie błędów).
4. Zaimplementować mapowanie wyjątków serwisowych w handlerze na `ErrorResponseDTO` i statusy 400/403/404/500.
5. Zaktualizować dokumentację (`CHANGELOG.md`, ewentualne `/docs`) zgodnie z zasadami DOC_UPDATES.
6. Wykonać testy manualne (Postman/Thunder Client) dla ścieżek: sukces, brak body, gość, zły token, brak eventu.
7. Przeprowadzić code review.
