# API Endpoint Implementation Plan: GET /api/events

## 1. Przegląd punktu końcowego

- Pobiera listę wydarzeń zalogowanego użytkownika z opcjonalnym filtrowaniem (saved, category, age_category), sortowaniem i paginacją.
- Wykorzystuje RLS dla automatycznej izolacji danych między użytkownikami.
- Zwraca metadane paginacji (total, total_pages, has_next, has_prev) potrzebne dla UI.
- Wymaga autentykacji Bearer token; brak dostępu dla gości lub wydarzeń innych użytkowników.

## 2. Szczegóły żądania

- Metoda HTTP: `GET`
- Ścieżka: `/api/events`
- Nagłówki: `Authorization: Bearer <token>`
- Parametry query (wszystkie opcjonalne):
  - `saved` (boolean): filtr po statusie zapisania
  - `category` (event_category enum): filtr po kategorii wydarzenia
  - `age_category` (age_category enum): filtr po kategorii wiekowej
  - `page` (integer, default: 1, min: 1): numer strony
  - `limit` (integer, default: 20, range: 1-100): liczba elementów na stronie
  - `sort` (string, default: "created_at"): pole sortowania (created_at, event_date, title)
  - `order` (string, default: "desc"): kierunek sortowania (asc, desc)
- Walidacja query:
  - Schemat Zod z transformacją string→boolean dla `saved` i string→number dla `page`/`limit`
  - Enum validation dla `category`, `age_category`, `sort`, `order`
- DTO & Command modele:
  - `EventsQueryDTO` (istniejący) – wejście walidacji
  - Nowy `GetUserEventsCommand` (`userId`, filtry, paginacja, sortowanie)
  - Nowy `GetUserEventsResult` (`data: EventListItemDTO[]`, `pagination: PaginationDTO`)

## 3. Szczegóły odpowiedzi

- Sukces 200: `EventsListResponseDTO` z tablicą `EventListItemDTO` (bez `model_version`) i metadanymi paginacji
- Błędy:
  - 401: `ErrorResponseDTO` gdy brak tokenu lub token nieprawidłowy/wygasły
  - 400: `ErrorResponseDTO` z `details` dla błędów walidacji query parameters
  - 500: `ErrorResponseDTO` w przypadku błędów Supabase lub nieoczekiwanych wyjątków
- Wszystkie odpowiedzi JSON z nagłówkiem `Content-Type: application/json`

## 4. Przepływ danych

1. Handler odczytuje query parameters z URL, waliduje przez `getUserEventsQuerySchema`
2. Weryfikacja tokenu: `locals.supabase.auth.getUser()` – niepowodzenie → 401
3. Budowa `GetUserEventsCommand` (userId z tokenu, query params)
4. Serwis `getUserEvents`:
   - Buduje dwa zapytania Supabase: count query i data query (z filtrami, sortowaniem, paginacją)
   - Wykonuje zapytania równolegle przez `Promise.all` dla performance
   - Mapuje wyniki do `EventListItemDTO` (omit `model_version`)
   - Oblicza metadane paginacji (total_pages, has_next, has_prev)
5. Handler zwraca 200 z `EventsListResponseDTO` lub propaguje błędy jako odpowiednie statusy HTTP

## 5. Względy bezpieczeństwa

- Autoryzacja wymagana (Bearer token) – brak dostępu dla gości
- RLS automatycznie filtruje wydarzenia po `user_id = auth.uid()` – użytkownik widzi tylko swoje wydarzenia
- Podwójna kontrola własności w zapytaniu (`.eq("user_id", userId)`) jako dodatkowe zabezpieczenie
- Walidacja enum values zapobiega SQL injection i nieprawidłowym wartościom
- Limit max 100 elementów na stronie chroni przed przeciążeniem
- Query parameters sanitized przez Zod (transformacje, type checking)

## 6. Obsługa błędów

- `401 Unauthorized`: brak nagłówka Authorization lub błąd `getUser()`
- `400 Bad Request`: błędy walidacji query params (limit > 100, page < 1, invalid enum)
- `500 Internal Server Error`: błędy Supabase (count/query failed) lub nieoczekiwane wyjątki
- Klasyfikacja błędów serwisu przez `EventServiceError` z kodami (`QUERY_FAILED`, `COUNT_FAILED`, `UNEXPECTED_ERROR`)
- Handler mapuje kody na statusy HTTP; logi błędów przez `console.error`

## 7. Wydajność

- Indeksy w bazie: `user_id`, composite indexes (`user_id + saved`, `user_id + category`, `user_id + age_category`), sortowanie (created_at, event_date, title)
- Równoległe wykonanie count i data query (Promise.all) zmniejsza latency o ~50%
- LIMIT/OFFSET dla paginacji – akceptowalne dla małych/średnich offsetów; cursor-based pagination dla page > 100 (future enhancement)
- Mapowanie do `EventListItemDTO` omija `model_version` by zmniejszyć rozmiar odpowiedzi
- Supabase automatycznie zarządza connection pooling

## 8. Kroki implementacji

1. Dodać `getUserEventsQuerySchema` w `src/lib/validators/events.ts` z transformacjami i domyślnymi wartościami; export typu `GetUserEventsQueryInput`
2. W `src/lib/services/events.service.ts` dodać `GetUserEventsCommand`, `GetUserEventsResult`, funkcję `getUserEvents` z logiką budowania query, filtrów, równoległego wykonania, mapowania do DTO i obliczania paginacji
3. Rozszerzyć `src/pages/api/events/index.ts` o handler `GET`: walidacja query params, weryfikacja tokenu, wywołanie serwisu, mapowanie błędów na statusy HTTP (401/400/500)
4. Utworzyć migrację Supabase z indeksami (user_id, composite indexes, sorting indexes); zastosować lokalnie przez `supabase db push`
5. Przygotować testy manualne w `docs/manual-tests/get-user-events.md` (curl commands dla success/error cases)
6. Zaktualizować dokumentację (`.ai/api-plan.md` z checkboxem, `CHANGELOG.md` z nową funkcjonalnością)
7. Uruchomić linty (`npm run lint`) i build (`npm run build`); naprawić błędy
