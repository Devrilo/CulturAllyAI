# API Endpoint Implementation Plan: DELETE /api/events/:id

## 1. Przegląd punktu końcowego
- Wykonuje soft delete wydarzenia poprzez ustawienie flagi `saved` na `false`.
- Wymaga autoryzacji Bearer token - tylko właściciel wydarzenia może je usunąć.
- Obsługuje wyłącznie wydarzenia utworzone przez zalogowanych użytkowników (`created_by_authenticated_user = true`).
- Rejestruje akcję w `event_management_logs` z typem `event_deleted`.
- Zwraca komunikat potwierdzający wraz z ID usuniętego wydarzenia.
- Wykorzystuje RLS oraz jawne filtrowanie po `user_id` dla dodatkowego bezpieczeństwa.

## 2. Szczegóły żądania
- Metoda HTTP: `DELETE`
- Ścieżka: `/api/events/:id`
- Nagłówki: `Authorization: Bearer <token>`
- Parametry path:
  - `id` (UUID, wymagane): identyfikator wydarzenia do usunięcia
- Parametry query: brak
- Request body: brak
- Walidacja parametrów:
  - Schemat Zod dla path params (`deleteEventParamsSchema`) z walidacją UUID
  - Token Bearer weryfikowany przez `supabase.auth.getUser()`
- DTO & Command modele:
  - Wejście: `id` jako string (po walidacji UUID)
  - Nowy `DeleteEventCommand` (`eventId: string`, `userId: string`)
  - Nowy `DeleteEventResult` (`eventId: string`, `message: string`)

## 3. Szczegóły odpowiedzi
- Sukces 200: `MessageResponseDTO` z polami `message` i `id`
  ```json
  {
    "message": "Event removed from saved list",
    "id": "uuid"
  }
  ```
- Błędy:
  - 400: `ErrorResponseDTO` z `details` dla błędów walidacji UUID
  - 401: `ErrorResponseDTO` gdy brak tokenu lub token nieprawidłowy/wygasły
  - 403: `ErrorResponseDTO` gdy wydarzenie należy do użytkownika ale zostało utworzone jako gość (`created_by_authenticated_user = false`)
  - 404: `ErrorResponseDTO` gdy wydarzenie nie istnieje lub nie należy do użytkownika
  - 500: `ErrorResponseDTO` w przypadku błędów Supabase lub nieoczekiwanych wyjątków
- Wszystkie odpowiedzi JSON z nagłówkiem `Content-Type: application/json`

## 4. Przepływ danych
1. Handler odczytuje parametr `id` z path (`context.params.id`)
2. Walidacja UUID przez `deleteEventParamsSchema` (Zod)
3. Weryfikacja tokenu: `locals.supabase.auth.getUser()` – niepowodzenie lub brak użytkownika → 401
4. Budowa `DeleteEventCommand` (eventId z params, userId z tokenu)
5. Serwis `deleteEvent`:
   - Wykonuje zapytanie `.update({ saved: false }).eq("id", eventId).eq("user_id", userId).select().single()`
   - Sprawdza błędy Supabase (PGRST116 dla brak rekordu → 404)
   - Waliduje czy `created_by_authenticated_user = true` (w przeciwnym razie → 403)
   - Tworzy wpis w `event_management_logs` z action_type `event_deleted`
6. Handler zwraca 200 z `MessageResponseDTO` lub propaguje błędy jako odpowiednie statusy HTTP

## 5. Względy bezpieczeństwa
- Autoryzacja wymagana (Bearer token) – każde żądanie musi być autentykowane
- RLS automatycznie filtruje po `user_id = auth.uid()`, ale dodajemy jawne `.eq("user_id", userId)` jako defense-in-depth
- Walidacja UUID zapobiega SQL injection i nieprawidłowym wartościom w zapytaniu
- Odpowiedź 404 zarówno gdy wydarzenie nie istnieje, jak i gdy należy do innego użytkownika (brak ujawniania czy ID istnieje w systemie – ochrona przed timing attacks)
- Wydarzenia gości (`created_by_authenticated_user = false`) automatycznie odrzucane z kodem 403
- Podwójna weryfikacja własności: RLS policy + explicit filter w query
- Soft delete zamiast hard delete – zachowanie danych do audytu i potencjalnego przywrócenia
- Walidacja `created_by_authenticated_user` flagi zapobiega próbom usunięcia wydarzeń gości

## 6. Obsługa błędów
- `400 Bad Request`: nieprawidłowy format UUID w parametrze `id`
- `401 Unauthorized`: 
  - Brak nagłówka Authorization
  - Token nieprawidłowy lub wygasły (błąd z `getUser()`)
  - Brak użytkownika w sesji
- `403 Forbidden`:
  - Wydarzenie należy do użytkownika ale `created_by_authenticated_user = false`
  - Próba usunięcia wydarzenia utworzonego jako gość przez tego samego użytkownika
- `404 Not Found`:
  - Wydarzenie o danym ID nie istnieje
  - Wydarzenie istnieje ale ma inny `user_id` (Supabase zwróci PGRST116)
  - Wydarzenie ma `user_id = null` (utworzone przez gościa)
- `500 Internal Server Error`: błędy Supabase (inne niż PGRST116) lub nieoczekiwane wyjątki
- Klasyfikacja błędów serwisu przez `EventServiceError` z kodami (`EVENT_NOT_FOUND`, `EVENT_NOT_OWNED`, `EVENT_DELETE_FAILED`, `GUEST_EVENT_MODIFICATION`, `UNEXPECTED_ERROR`)
- Handler mapuje kody na statusy HTTP; logi błędów przez `console.error`

## 7. Wydajność
- Operacja UPDATE po primary key (`id`) + `user_id` – bardzo szybka dzięki indeksom
- Użycie `.single()` gwarantuje max 1 rekord lub błąd (brak przetwarzania list)
- Transakcja obejmuje UPDATE + INSERT do logs – minimalne overhead
- RLS policy ewaluowana przez PostgreSQL w warstwie bazy (minimal overhead)
- Użycie `.select()` po UPDATE z klauzulą `RETURNING` unika dodatkowego SELECT
- Brak potrzeby cache'owania – operacja write, natychmiastowy efekt
- Możliwość batching dla multiple delete (przyszła optymalizacja) – obecnie single delete only

## 8. Kroki implementacji
1. Dodać `deleteEventParamsSchema` w `src/lib/validators/events.ts` z walidacją UUID; export typu `DeleteEventParamsInput`
   ```typescript
   export const deleteEventParamsSchema = z.object({
     id: z.string().uuid("Invalid event ID format")
   });
   export type DeleteEventParamsInput = z.infer<typeof deleteEventParamsSchema>;
   ```
2. W `src/lib/services/events.service.ts` dodać `DeleteEventCommand`, `DeleteEventResult`, funkcję `deleteEvent`:
   - Wykonać `.update({ saved: false }).eq("id", eventId).eq("user_id", userId).select().single()`
   - Obsłużyć błąd PGRST116 jako 404 (`EVENT_NOT_FOUND`)
   - Sprawdzić flagę `created_by_authenticated_user` – jeśli false, rzucić błąd `GUEST_EVENT_MODIFICATION`
   - Utworzyć wpis w `event_management_logs` z `action_type: 'event_deleted'`
   - Obsłużyć inne błędy Supabase jako 500 (`EVENT_DELETE_FAILED`)
   - Zwrócić `DeleteEventResult` lub rzucić `EventServiceError`
3. Rozszerzyć `src/pages/api/events/[id].ts` o handler `DELETE`:
   - Walidacja `id` z path params przez Zod
   - Weryfikacja tokenu przez `getUser()` – brak użytkownika → 401
   - Wywołanie `deleteEvent` z supabase i command
   - Mapowanie błędów na statusy HTTP (400/401/403/404/500)
   - Zwrócenie `MessageResponseDTO` z message i id
4. Przygotować testy manualne w `docs/manual-tests/delete-event-id.md`:
   - Sukces: curl z poprawnym tokenem i ID własnego zapisanego wydarzenia
   - Weryfikacja: sprawdzenie że `saved = false` w bazie danych
   - Weryfikacja: sprawdzenie wpisu w `event_management_logs`
   - 400: nieprawidłowy format UUID
   - 401: brak tokenu, nieprawidłowy token
   - 403: próba usunięcia wydarzenia gościa przez zalogowanego użytkownika
   - 404: nieistniejące ID, ID wydarzenia innego użytkownika
5. Zaktualizować dokumentację:
   - `.ai/api-plan.md` z checkboxem dla DELETE /api/events/:id
   - `CHANGELOG.md` z nową funkcjonalnością soft delete
   - Dodać informację o logowaniu akcji w sekcji audit
6. Uruchomić linty (`npm run lint`) i build (`npm run build`); naprawić błędy
