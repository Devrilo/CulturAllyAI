# Testy Manualne: DELETE /api/events/{id} (Soft Delete)

## Przegląd

Endpoint DELETE /api/events/:id wykonuje operację **soft delete** na wydarzeniu poprzez ustawienie pola `saved = false`. Nie usuwa rekordu z bazy danych - pozwala tylko na "odklikanie" zapisanego wydarzenia.

**Kluczowe cechy:**

- Wymaga autoryzacji (Bearer token)
- Działa tylko dla wydarzeń należących do zalogowanego użytkownika
- Blokuje usuwanie wydarzeń utworzonych przez gości (`created_by_authenticated_user = false`)
- Loguje akcję w tabeli `event_management_logs` z typem `event_deleted`
- Wykorzystuje RLS + jawne filtrowanie po `user_id` dla bezpieczeństwa

---

## Przygotowanie środowiska testowego

### Wymagania wstępne

- Uruchomiony lokalny Supabase (`supabase start`)
- Aplikacja uruchomiona na `http://localhost:3000`
- Zainstalowany Postman lub curl
- Użytkownik testowy w bazie danych

### Konfiguracja Postmana - Uzyskanie tokenu dostępowego

Przed wykonaniem testów musisz uzyskać token dostępowy (access_token) dla użytkownika.

#### Krok 1: Logowanie przez Supabase Auth API

**Request:**

```
POST http://127.0.0.1:54321/auth/v1/token?grant_type=password
```

**Headers:**

```
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXPooJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Body (raw JSON):**

```json
{
  "email": "marcin.szwajgier@o2.pl",
  "password": "awxc56GH"
}
```

**Oczekiwana odpowiedź (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "32373b34-4b94-4cbc-973b-949c6659cbee",
    "email": "marcin.szwajgier@o2.pl",
    ...
  }
}
```

#### Krok 2: Skopiowanie access_token

Skopiuj wartość `access_token` z odpowiedzi. Będzie potrzebny we wszystkich testach w headerze `Authorization`.

---

## PRZYPADEK TESTOWY 1A: Soft delete zapisanego wydarzenia (Sukces - 200)

### Opis

Usunięcie (soft delete) wydarzenia, które jest zapisane (`saved = true`) i należy do zalogowanego użytkownika.
Po operacji pole `saved` powinno zostać ustawione na `false`.

### Dane testowe

- Event ID: `c774ab0f-306a-4195-95fd-34fdd5c65468`
- created_by_authenticated_user: `true`
- user_id: `32373b34-4b94-4cbc-973b-949c6659cbee`
- saved: `true` (przed testem)

### Kroki wykonania

#### 1. Weryfikacja stanu przed testem (opcjonalnie)

Możesz sprawdzić stan wydarzenia przed wykonaniem soft delete:

**Request GET:**

```
GET http://localhost:3000/api/events/c774ab0f-306a-4195-95fd-34fdd5c65468
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Weryfikacja:** Sprawdź że `saved = true`

#### 2. Otwórz Postman i utwórz nowy request

#### 3. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/c774ab0f-306a-4195-95fd-34fdd5c65468
```

**Headers:**

```
Authorization: Bearer <TWÓJ_ACCESS_TOKEN_Z_KROKU_PRZYGOTOWANIA>
```

**Body:** Brak (DELETE nie przyjmuje body)

#### 4. Wyślij request (kliknij "Send")

#### 5. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "message": "Event removed from saved list",
  "id": "c774ab0f-306a-4195-95fd-34fdd5c65468"
}
```

#### 6. Weryfikacja w bazie danych

Sprawdź w bazie danych, że pole `saved` zostało ustawione na `false`:

**Zapytanie SQL w Supabase Studio:**

```sql
SELECT id, title, saved, updated_at
FROM events
WHERE id = 'c774ab0f-306a-4195-95fd-34fdd5c65468';
```

**Oczekiwany wynik:**

- `saved` = `false`
- `updated_at` ma nową datę

#### 7. Weryfikacja logowania akcji

Sprawdź czy akcja została zalogowana w `event_management_logs`:

**Zapytanie SQL:**

```sql
SELECT action_type, event_id, user_id, created_at
FROM event_management_logs
WHERE event_id = 'c774ab0f-306a-4195-95fd-34fdd5c65468'
ORDER BY created_at DESC
LIMIT 1;
```

**Oczekiwany wynik:**

- `action_type` = `'event_deleted'`
- `event_id` = `'c774ab0f-306a-4195-95fd-34fdd5c65468'`
- `user_id` = `'32373b34-4b94-4cbc-973b-949c6659cbee'`

---

## PRZYPADEK TESTOWY 1B: Soft delete wydarzenia już niezapisanego (Sukces - 200)

### Opis

Próba soft delete wydarzenia, które ma już `saved = false`.
Operacja powinna zakończyć się sukcesem (idempotentność), ale w bazie danych nic się nie zmieni.

### Dane testowe

- Event ID: `3cc6c482-e88f-496f-a8fc-b2f3669a0b44`
- created_by_authenticated_user: `true`
- user_id: `32373b34-4b94-4cbc-973b-949c6659cbee`
- saved: `false` (przed testem)

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
```

**Headers:**

```
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "message": "Event removed from saved list",
  "id": "3cc6c482-e88f-496f-a8fc-b2f3669a0b44"
}
```

**Wyjaśnienie:**
Operacja jest idempotentna - wykonanie soft delete na już "usuniętym" wydarzeniu nie powoduje błędu.

---

## PRZYPADEK TESTOWY 2A: Nieprawidłowy format UUID (Błąd - 400)

### Opis

Próba soft delete wydarzenia z nieprawidłowym formatem ID (nie jest to poprawny UUID).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/nieprawidlowy-uuid-123
```

**Headers:**

```
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Validation Error",
  "message": "Parametr ID jest nieprawidłowy",
  "details": [
    {
      "field": "id",
      "message": "Identyfikator wydarzenia musi być prawidłowym UUID"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 2B: Puste ID w URL (Błąd - 404)

### Opis

Próba wywołania endpointa bez podania ID wydarzenia w URL.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/
```

**Uwaga:** URL kończy się na `/events/` bez ID

**Headers:**

```
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `404 Not Found`

**Oczekiwana odpowiedź:**
Astro zwróci błąd, że route nie został znaleziony (brak handlera DELETE dla `/api/events`).

---

## PRZYPADEK TESTOWY 3A: Brak tokenu autoryzacyjnego (Błąd - 401)

### Opis

Próba soft delete wydarzenia bez podania tokenu autoryzacyjnego.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/c774ab0f-306a-4195-95fd-34fdd5c65468
```

**Headers:**
Nie dodawaj headera `Authorization`!

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `401 Unauthorized`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Unauthorized",
  "message": "Wymagana jest autoryzacja"
}
```

---

## PRZYPADEK TESTOWY 3B: Nieprawidłowy token (Błąd - 401)

### Opis

Próba soft delete wydarzenia z nieprawidłowym lub wygasłym tokenem.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/c774ab0f-306a-4195-95fd-34fdd5c65468
```

**Headers:**

```
Authorization: Bearer invalid_token_xyz123
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `401 Unauthorized`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Unauthorized",
  "message": "Wymagana jest autoryzacja"
}
```

---

## PRZYPADEK TESTOWY 4A: Próba usunięcia wydarzenia innego użytkownika (Błąd - 404)

### Opis

Próba soft delete wydarzenia, które należy do innego użytkownika.
RLS automatycznie blokuje dostęp, więc endpoint zwróci 404 zamiast 403 (nie ujawniamy czy ID istnieje).

### Przygotowanie

Musisz mieć dwa konta użytkowników i wydarzenia utworzone przez użytkownika A.
Próbujesz usunąć to wydarzenie jako użytkownik B.

### Dane testowe

- Event ID: `<ID_WYDARZENIA_UŻYTKOWNIKA_A>`
- Zalogowany jako: Użytkownik B

### Kroki wykonania

#### 1. Zaloguj się jako użytkownik B i uzyskaj jego token

#### 2. Otwórz Postman i utwórz nowy request

#### 3. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/<ID_WYDARZENIA_UŻYTKOWNIKA_A>
```

**Headers:**

```
Authorization: Bearer <TOKEN_UŻYTKOWNIKA_B>
```

#### 4. Wyślij request

#### 5. Weryfikacja odpowiedzi

**Oczekiwany status:** `404 Not Found`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Not Found",
  "message": "Wydarzenie nie zostało znalezione"
}
```

**Wyjaśnienie:**
RLS blokuje dostęp do wydarzeń innych użytkowników. Supabase zwraca błąd PGRST116 (no rows), który jest mapowany na 404.
Nie używamy 403, aby nie ujawniać istnienia wydarzenia (ochrona przed enumeracją ID).

---

## PRZYPADEK TESTOWY 4B: Nieistniejące ID wydarzenia (Błąd - 404)

### Opis

Próba soft delete wydarzenia, które nie istnieje w bazie danych.

### Dane testowe

- Event ID: `00000000-0000-0000-0000-000000000000` (prawidłowy UUID, ale nieistniejący)

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/00000000-0000-0000-0000-000000000000
```

**Headers:**

```
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `404 Not Found`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Not Found",
  "message": "Wydarzenie nie zostało znalezione"
}
```

---

## PRZYPADEK TESTOWY 5A: Próba usunięcia wydarzenia gościa (Błąd - 403)

### Opis

Próba soft delete wydarzenia, które zostało utworzone przez gościa (`created_by_authenticated_user = false`).
Nawet jeśli `user_id` pasuje, operacja jest zabroniona ze względów bezpieczeństwa.

### Dane testowe

- Event ID: `50a5338b-18a2-4454-bf1e-ec379a2dd046`
- created_by_authenticated_user: `false`
- user_id: `NULL` (utworzone jako gość)

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/50a5338b-18a2-4454-bf1e-ec379a2dd046
```

**Headers:**

```
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `404 Not Found` (z powodu RLS)

**Oczekiwana odpowiedź:**

```json
{
  "error": "Not Found",
  "message": "Wydarzenie nie zostało znalezione"
}
```

**Wyjaśnienie:**
RLS automatycznie blokuje dostęp do wydarzeń gości (`user_id = NULL` nie pasuje do zalogowanego użytkownika).
Endpoint nigdy nie dotrze do logiki sprawdzającej `created_by_authenticated_user`, bo RLS odrzuci zapytanie wcześniej.

**Uwaga dla przyszłości:**
Jeśli w przyszłości zmienisz polityki RLS tak, aby zalogowani użytkownicy mogli widzieć swoje wydarzenia gościa
(np. przez powiązanie session_id), wtedy ten test powinien zwrócić `403 Forbidden` z komunikatem
"Usuwanie wydarzeń utworzonych przez gości jest zabronione".

---

## PRZYPADEK TESTOWY 5B: Wydarzenie z usuniętego konta (Błąd - 404)

### Opis

Próba soft delete wydarzenia, które zostało utworzone przez zalogowanego użytkownika, ale konto zostało usunięte.
Wydarzenie ma `created_by_authenticated_user = true` ale `user_id = NULL`.

### Dane testowe

- Event ID: `5af88917-3f9d-41b8-9af8-67f9ac1d4418`
- created_by_authenticated_user: `true`
- user_id: `NULL` (konto usunięte)

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `DELETE`

**URL:**

```
http://localhost:3000/api/events/5af88917-3f9d-41b8-9af8-67f9ac1d4418
```

**Headers:**

```
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `404 Not Found`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Not Found",
  "message": "Wydarzenie nie zostało znalezione"
}
```

**Wyjaśnienie:**
RLS blokuje dostęp, ponieważ `user_id = NULL` nie pasuje do ID zalogowanego użytkownika.

---

## PRZYPADEK TESTOWY 6A: Wielokrotne soft delete tego samego wydarzenia (Sukces - 200)

### Opis

Test idempotentności operacji soft delete.
Wykonanie soft delete na tym samym wydarzeniu dwa razy z rzędu powinno zakończyć się sukcesem oba razy.

### Dane testowe

- Event ID: `3e11b5de-7733-4ffd-b454-82b9dbe00777`
- created_by_authenticated_user: `true`
- user_id: `32373b34-4b94-4cbc-973b-949c6659cbee`
- saved: `true` (przed pierwszym testem)

### Kroki wykonania

#### 1. Pierwsze wywołanie soft delete

**Request:**

```
DELETE http://localhost:3000/api/events/3e11b5de-7733-4ffd-b454-82b9dbe00777
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Oczekiwany status:** `200 OK`

**Weryfikacja:** `saved` zmienione z `true` na `false`

#### 2. Drugie wywołanie soft delete (na tym samym wydarzeniu)

**Request:**

```
DELETE http://localhost:3000/api/events/3e11b5de-7733-4ffd-b454-82b9dbe00777
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "message": "Event removed from saved list",
  "id": "3e11b5de-7733-4ffd-b454-82b9dbe00777"
}
```

**Weryfikacja:** `saved` pozostaje `false` (brak zmiany)

#### 3. Weryfikacja w bazie danych

Sprawdź ile razy akcja została zalogowana:

**Zapytanie SQL:**

```sql
SELECT COUNT(*) as deletion_count
FROM event_management_logs
WHERE event_id = '3e11b5de-7733-4ffd-b454-82b9dbe00777'
AND action_type = 'event_deleted';
```

**Oczekiwany wynik:**

- `deletion_count` = `2` (każde wywołanie loguje akcję, nawet jeśli `saved` nie zmienia się)

---

## PRZYPADEK TESTOWY 6B: Przywrócenie i ponowne soft delete

### Opis

Test scenariusza: zapisanie → soft delete → zapisanie ponownie → soft delete ponownie.

### Dane testowe

- Event ID: `3cc6c482-e88f-496f-a8fc-b2f3669a0b44`
- created_by_authenticated_user: `true`
- user_id: `32373b34-4b94-4cbc-973b-949c6659cbee`

### Kroki wykonania

#### 1. Zapisanie wydarzenia (PATCH)

**Request:**

```
PATCH http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
Content-Type: application/json

{
  "saved": true
}
```

**Oczekiwany status:** `200 OK`

**Weryfikacja:** `saved` = `true`

#### 2. Soft delete (DELETE)

**Request:**

```
DELETE http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Oczekiwany status:** `200 OK`

**Weryfikacja:** `saved` = `false`

#### 3. Zapisanie ponownie (PATCH)

**Request:**

```
PATCH http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
Content-Type: application/json

{
  "saved": true
}
```

**Oczekiwany status:** `200 OK`

**Weryfikacja:** `saved` = `true`

#### 4. Soft delete ponownie (DELETE)

**Request:**

```
DELETE http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Oczekiwany status:** `200 OK`

**Weryfikacja:** `saved` = `false`

#### 5. Weryfikacja logów w bazie danych

**Zapytanie SQL:**

```sql
SELECT action_type, created_at
FROM event_management_logs
WHERE event_id = '3cc6c482-e88f-496f-a8fc-b2f3669a0b44'
ORDER BY created_at DESC
LIMIT 4;
```

**Oczekiwany wynik (od najnowszego):**

1. `action_type = 'event_deleted'`
2. `action_type = 'event_saved'`
3. `action_type = 'event_deleted'`
4. `action_type = 'event_saved'`

---

## Podsumowanie testów

### Matryca przypadków testowych

| Test | Typ          | Scenariusz                        | Event ID             | Oczekiwany status | Oczekiwany rezultat     |
| ---- | ------------ | --------------------------------- | -------------------- | ----------------- | ----------------------- |
| 1A   | ✅ Pozytywny | Soft delete zapisanego wydarzenia | `c774ab0f...`        | 200               | Sukces, `saved = false` |
| 1B   | ✅ Pozytywny | Soft delete już niezapisanego     | `3cc6c482...`        | 200               | Sukces (idempotentność) |
| 2A   | ❌ Negatywny | Nieprawidłowy format UUID         | `nieprawidlowy-uuid` | 400               | Validation error        |
| 2B   | ❌ Negatywny | Puste ID w URL                    | `/events/`           | 404               | Route not found         |
| 3A   | ❌ Negatywny | Brak tokenu autoryzacyjnego       | `c774ab0f...`        | 401               | Unauthorized            |
| 3B   | ❌ Negatywny | Nieprawidłowy token               | `c774ab0f...`        | 401               | Unauthorized            |
| 4A   | ❌ Negatywny | Wydarzenie innego użytkownika     | `<user_a_event>`     | 404               | Event not found (RLS)   |
| 4B   | ❌ Negatywny | Nieistniejące ID                  | `00000000...`        | 404               | Event not found         |
| 5A   | ❌ Negatywny | Wydarzenie gościa (user_id=NULL)  | `50a5338b...`        | 404               | Event not found (RLS)   |
| 5B   | ❌ Negatywny | Wydarzenie z usuniętego konta     | `5af88917...`        | 404               | Event not found (RLS)   |
| 6A   | ✅ Pozytywny | Wielokrotne soft delete           | `3e11b5de...`        | 200               | Sukces (idempotentność) |
| 6B   | ✅ Pozytywny | Zapisz → usuń → zapisz → usuń     | `3cc6c482...`        | 200               | Sukces (cykl życia)     |

### Legenda statusów HTTP

- **200 OK** - Sukces, wydarzenie zostało soft deleted (`saved = false`)
- **400 Bad Request** - Błąd walidacji parametru `id` (nieprawidłowy UUID)
- **401 Unauthorized** - Brak autoryzacji (brak tokenu lub nieprawidłowy token)
- **403 Forbidden** - Brak uprawnień (teoretycznie dla wydarzeń gości, ale RLS blokuje wcześniej)
- **404 Not Found** - Wydarzenie nie zostało znalezione (lub brak dostępu przez RLS)
- **500 Internal Server Error** - Nieoczekiwany błąd serwera

---

## Uwagi końcowe

### 1. Token wygasa po 1 godzinie

Jeśli otrzymasz błąd 401 podczas testowania, wykonaj ponownie krok przygotowania i uzyskaj nowy token.

### 2. RLS (Row Level Security)

Supabase automatycznie filtruje wyniki na podstawie polityk RLS. Jeśli wydarzenie nie należy do zalogowanego użytkownika, otrzymasz 404 zamiast 403, co chroni przed enumeracją ID.

### 3. Pole updated_at

Jest automatycznie aktualizowane przez trigger bazodanowy `update_updated_at_column` przy każdej modyfikacji rekordu.

### 4. Logowanie akcji

Każda udana operacja soft delete jest zapisywana w tabeli `event_management_logs` z typem `event_deleted`, nawet jeśli `saved` już było `false`.

### 5. Soft delete vs Hard delete

Ten endpoint NIE usuwa rekordów z bazy danych. Ustawia tylko `saved = false`, co pozwala na późniejsze przywrócenie wydarzenia przez PATCH z `saved = true`.

### 6. Różnica między PATCH i DELETE

- **PATCH** `/api/events/:id` - Pozwala na zmianę `saved`, `feedback`, `edited_description`
- **DELETE** `/api/events/:id` - Ustawia tylko `saved = false` (soft delete)

Użytkownik może użyć PATCH do "odznaczenia" zapisanego wydarzenia (`saved: false`) lub DELETE do szybkiego soft delete.

### 7. Przywracanie stanu testowego

Po wykonaniu testów możesz chcieć przywrócić oryginalne wartości w bazie danych za pomocą PATCH lub bezpośrednio w SQL:

```sql
UPDATE events
SET saved = true
WHERE id = 'c774ab0f-306a-4195-95fd-34fdd5c65468';
```

### 8. Weryfikacja polityk RLS

Możesz sprawdzić aktywne polityki RLS dla tabeli `events`:

```sql
SELECT * FROM pg_policies
WHERE tablename = 'events';
```

Upewnij się, że polityka dla DELETE lub UPDATE wymaga `user_id = auth.uid()`.

---

## Dodatkowe scenariusze testowe (opcjonalne)

### Test: Konkurencyjne soft delete (Race Condition)

Symulacja dwóch równoczesnych żądań soft delete na tym samym wydarzeniu:

1. Otwórz dwa okna Postmana
2. Skonfiguruj identyczne requesty DELETE na to samo wydarzenie
3. Kliknij "Send" w obu oknach jednocześnie

**Oczekiwany rezultat:**

- Oba żądania powinny zwrócić 200 OK
- W bazie danych `saved = false`
- W `event_management_logs` powinny być 2 wpisy z `action_type = 'event_deleted'`

### Test: Soft delete po edycji opisu

1. Edytuj wydarzenie (PATCH) - dodaj `edited_description`
2. Wykonaj soft delete (DELETE)
3. Sprawdź czy `edited_description` jest zachowany po soft delete

**Oczekiwany rezultat:**

- Soft delete nie usuwa `edited_description`
- Wszystkie pola poza `saved` i `updated_at` pozostają niezmienione

### Test: Soft delete po ocenie thumbs_down

1. Dodaj ocenę (PATCH) - ustaw `feedback: "thumbs_down"`
2. Wykonaj soft delete (DELETE)
3. Sprawdź czy `feedback` jest zachowana

**Oczekiwany rezultat:**

- Soft delete nie zmienia `feedback`
- `feedback` pozostaje `"thumbs_down"`

---

## Curl - Przykłady poleceń

Dla użytkowników preferujących curl zamiast Postmana:

### Sukces (200):

```bash
curl -X DELETE "http://localhost:3000/api/events/c774ab0f-306a-4195-95fd-34fdd5c65468" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Brak autoryzacji (401):

```bash
curl -X DELETE "http://localhost:3000/api/events/c774ab0f-306a-4195-95fd-34fdd5c65468"
```

### Nieprawidłowy UUID (400):

```bash
curl -X DELETE "http://localhost:3000/api/events/invalid-uuid" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Nieistniejące ID (404):

```bash
curl -X DELETE "http://localhost:3000/api/events/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Troubleshooting

### Problem: Otrzymuję 500 zamiast 200

**Możliwe przyczyny:**

1. Baza danych nie jest uruchomiona (`supabase start`)
2. Tabela `event_management_logs` nie istnieje lub nie ma uprawnień INSERT
3. Trigger `update_updated_at_column` jest nieprawidłowo skonfigurowany

**Rozwiązanie:**

- Sprawdź logi serwera (`npm run dev` output)
- Sprawdź logi Supabase (`supabase logs`)
- Zweryfikuj strukturę bazy danych

### Problem: Otrzymuję 404 dla mojego własnego wydarzenia

**Możliwe przyczyny:**

1. Token należy do innego użytkownika
2. `user_id` w wydarzeniu nie pasuje do `auth.uid()` z tokenu
3. Polityki RLS blokują dostęp

**Rozwiązanie:**

- Sprawdź ID użytkownika w tokenie (zdekoduj JWT na jwt.io)
- Sprawdź `user_id` w rekordzie wydarzenia w bazie
- Zweryfikuj polityki RLS dla tabeli `events`

### Problem: Logowanie nie działa (brak wpisów w event_management_logs)

**Możliwe przyczyny:**

1. Brak uprawnień INSERT dla tabeli `event_management_logs`
2. Polityka RLS blokuje INSERT
3. Constraint naruszony (np. foreign key)

**Rozwiązanie:**

- Sprawdź logi błędów w konsoli serwera
- Zweryfikuj polityki RLS dla `event_management_logs`
- Sprawdź czy `user_id` i `event_id` są prawidłowe

---

**Data ostatniej aktualizacji:** 2025-10-19
**Wersja API:** v1
**Autor:** CulturAllyAI Team
