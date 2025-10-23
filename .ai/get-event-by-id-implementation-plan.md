# API Endpoint Implementation Plan: GET /api/events/:id

## 1. Przegląd punktu końcowego

- Pobiera pojedyncze wydarzenie zalogowanego użytkownika na podstawie ID.
- Wykorzystuje RLS oraz jawne filtrowanie po `user_id` dla dodatkowego zabezpieczenia przed wyciekiem danych.
- Zwraca pełny obiekt wydarzenia (`EventResponseDTO`) zawierający wszystkie metadane, w tym `model_version` i znaczniki czasu.
- Wymaga autentykacji Bearer token; brak dostępu dla gości lub wydarzeń innych użytkowników.

## 2. Szczegóły żądania

- Metoda HTTP: `GET`
- Ścieżka: `/api/events/:id`
- Nagłówki: `Authorization: Bearer <token>`
- Parametry path:
  - `id` (UUID, wymagane): identyfikator wydarzenia
- Parametry query: brak
- Request body: brak
- Walidacja parametrów:
  - Schemat Zod dla path params (`getEventByIdParamsSchema`) z walidacją UUID
  - Token Bearer weryfikowany przez `supabase.auth.getUser()`
- DTO & Command modele:
  - Wejście: `id` jako string (po walidacji UUID)
  - Nowy `GetEventByIdCommand` (`eventId: string`, `userId: string`)
  - Nowy `GetEventByIdResult` (`event: EventResponseDTO`)

## 3. Szczegóły odpowiedzi

- Sukces 200: `EventResponseDTO` (pełny rekord wydarzenia ze wszystkimi polami)
- Błędy:
  - 400: `ErrorResponseDTO` z `details` dla błędów walidacji UUID
  - 401: `ErrorResponseDTO` gdy brak tokenu lub token nieprawidłowy/wygasły
  - 404: `ErrorResponseDTO` gdy wydarzenie nie istnieje lub nie należy do użytkownika
  - 500: `ErrorResponseDTO` w przypadku błędów Supabase lub nieoczekiwanych wyjątków
- Wszystkie odpowiedzi JSON z nagłówkiem `Content-Type: application/json`

## 4. Przepływ danych

1. Handler odczytuje parametr `id` z path (`context.params.id`)
2. Walidacja UUID przez `getEventByIdParamsSchema` (Zod)
3. Weryfikacja tokenu: `locals.supabase.auth.getUser()` – niepowodzenie lub brak użytkownika → 401
4. Budowa `GetEventByIdCommand` (eventId z params, userId z tokenu)
5. Serwis `getEventById`:
   - Wykonuje zapytanie `.select().eq("id", eventId).eq("user_id", userId).single()`
   - Sprawdza błędy Supabase (PGRST116 dla brak rekordu → 404)
   - Waliduje czy event istnieje i czy `user_id` się zgadza
6. Handler zwraca 200 z `EventResponseDTO` lub propaguje błędy jako odpowiednie statusy HTTP

## 5. Względy bezpieczeństwa

- Autoryzacja wymagana (Bearer token) – każde żądanie musi być autentykowane
- RLS automatycznie filtruje po `user_id = auth.uid()`, ale dodajemy jawne `.eq("user_id", userId)` jako defense-in-depth
- Walidacja UUID zapobiega SQL injection i nieprawidłowym wartościom w zapytaniu
- Odpowiedź 404 zarówno gdy wydarzenie nie istnieje, jak i gdy należy do innego użytkownika (brak ujawniania czy ID istnieje w systemie – ochrona przed timing attacks)
- Wydarzenia gości (`user_id = null`) automatycznie odfiltrowane przez warunek `.eq("user_id", userId)`
- Podwójna weryfikacja własności: RLS policy + explicit filter w query

## 6. Obsługa błędów

- `400 Bad Request`: nieprawidłowy format UUID w parametrze `id`
- `401 Unauthorized`:
  - Brak nagłówka Authorization
  - Token nieprawidłowy lub wygasły (błąd z `getUser()`)
  - Brak użytkownika w sesji
- `404 Not Found`:
  - Wydarzenie o danym ID nie istnieje
  - Wydarzenie istnieje ale ma inny `user_id` (Supabase zwróci PGRST116)
  - Wydarzenie ma `user_id = null` (utworzone przez gościa)
- `500 Internal Server Error`: błędy Supabase (inne niż PGRST116) lub nieoczekiwane wyjątki
- Klasyfikacja błędów serwisu przez `EventServiceError` z kodami (`EVENT_NOT_FOUND`, `EVENT_FETCH_FAILED`, `UNEXPECTED_ERROR`)
- Handler mapuje kody na statusy HTTP; logi błędów przez `console.error`

## 7. Wydajność

- Zapytanie single SELECT po primary key (`id`) + `user_id` – bardzo szybkie dzięki indeksom
- Użycie `.single()` gwarantuje max 1 rekord lub błąd (brak przetwarzania list)
- Brak dodatkowych JOIN-ów – bezpośredni SELECT z tabeli `events`
- RLS policy ewaluowana przez PostgreSQL w warstwie bazy (minimal overhead)
- Minimalna wielkość odpowiedzi – zwracany pojedynczy rekord JSON
- Brak cache'owania (dane mogą się zmieniać po edycji) – ewentualnie krótkotrwały cache na poziomie CDN (np. 1-5s) w przyszłości

## 8. Kroki implementacji

1. Dodać `getEventByIdParamsSchema` w `src/lib/validators/events.ts` z walidacją UUID; export typu `GetEventByIdParamsInput`
2. W `src/lib/services/events.service.ts` dodać `GetEventByIdCommand`, `GetEventByIdResult`, funkcję `getEventById`:
   - Wykonać `.select().eq("id", eventId).eq("user_id", userId).single()`
   - Obsłużyć błąd PGRST116 jako 404 (`EVENT_NOT_FOUND`)
   - Obsłużyć inne błędy Supabase jako 500 (`EVENT_FETCH_FAILED`)
   - Zwrócić `GetEventByIdResult` lub rzucić `EventServiceError`
3. Utworzyć/rozszerzyć `src/pages/api/events/[id].ts` z handlerem `GET`:
   - Walidacja `id` z path params przez Zod
   - Weryfikacja tokenu przez `getUser()` – brak użytkownika → 401
   - Wywołanie `getEventById` z supabase i command
   - Mapowanie błędów na statusy HTTP (400/401/404/500)
4. Przygotować testy manualne w `docs/manual-tests/get-event-by-id.md`:
   - Sukces: curl z poprawnym tokenem i ID własnego wydarzenia
   - 400: nieprawidłowy format UUID
   - 401: brak tokenu, nieprawidłowy token
   - 404: nieistniejące ID, ID wydarzenia innego użytkownika
5. Zaktualizować dokumentację (`.ai/api-plan.md` z checkboxem dla GET /api/events/:id, `CHANGELOG.md` z nową funkcjonalnością)
6. Uruchomić linty (`npm run lint`) i build (`npm run build`); naprawić błędy
