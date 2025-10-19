````markdown
# Testy Manualne: GET /api/events/:id

## Przygotowanie środowiska testowego

### Wymagania wstępne
- Uruchomiony lokalny Supabase (`supabase start`)
- Aplikacja uruchomiona na `http://localhost:3000`
- Zainstalowany Postman lub curl
- Utworzony użytkownik testowy z wydarzeniami w bazie

### Konfiguracja Postmana - Uzyskanie tokenu dostępowego (WYMAGANE!)

⚠️ **UWAGA:** Ten endpoint **wymaga autoryzacji**! Musisz podać prawidłowy token Bearer w nagłówku `Authorization`.

#### Krok 1: Uzyskaj access_token

**1. Utwórz nowy request w Postmanie**

**2. Skonfiguruj request:**

**Metoda:** `POST`

**URL:**
```
http://127.0.0.1:54321/auth/v1/token?grant_type=password
```

**3. Ustaw Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `apikey` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXPooJeXxjNni43kdQwgnWNReilDMblYTn_I0` |

**4. Ustaw Body (raw, JSON):**

```json
{
  "email": "marcin.szwajgier@o2.pl",
  "password": "awxc56GH"
}
```

**5. Send i skopiuj `access_token` z odpowiedzi**

Odpowiedź będzie zawierać:
```json
{
  "access_token": "eyJhbGc...",
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

Skopiuj wartość `access_token` - będzie potrzebna we wszystkich testach poniżej.

#### Krok 2: Przygotuj testowe wydarzenia

Utwórz kilka wydarzeń testowych za pomocą `POST /api/events`:

**Wydarzenie 1 - Należy do zalogowanego użytkownika**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TWÓJ_TOKEN>" \
  -d '{
    "title": "Koncert Chopina",
    "city": "Warszawa",
    "event_date": "2025-12-25T19:00:00Z",
    "category": "koncerty",
    "age_category": "dorosli",
    "key_information": "Wieczór z Chopinem w Filharmonii Narodowej"
  }'
```

**Zapisz UUID zwrócone w odpowiedzi - będzie potrzebne w testach!**
Np. `"id": "3cc6c482-e88f-496f-a8fc-b2f3669a0b44"`

**Wydarzenie 2 - Utworzone przez gościa (bez tokenu)**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wydarzenie Gościa",
    "city": "Gdańsk",
    "event_date": "2025-11-15T18:00:00Z",
    "category": "imprezy",
    "age_category": "wszystkie",
    "key_information": "Test wydarzenia gościa"
  }'
```

**Zapisz UUID tego wydarzenia - będzie potrzebne do testu błędu 404!**

**Wydarzenie 3 - Zaloguj się jako inny użytkownik i utwórz wydarzenie**

Jeśli masz dostęp do drugiego konta testowego, utwórz wydarzenie:
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_INNEGO_UŻYTKOWNIKA>" \
  -d '{
    "title": "Wydarzenie Innego Użytkownika",
    "city": "Kraków",
    "event_date": "2025-12-10T20:00:00Z",
    "category": "teatr_i_taniec",
    "age_category": "nastolatkowie",
    "key_information": "Spektakl teatralny"
  }'
```

**Zapisz UUID - będzie potrzebne do testu izolacji danych (404)!**

---

## PRZYPADEK TESTOWY 1: Pobranie wydarzenia należącego do zalogowanego użytkownika (Sukces - 200)

### Opis
Pobranie szczegółów wydarzenia, które należy do aktualnie zalogowanego użytkownika.

### Dane testowe
- Event ID: `3cc6c482-e88f-496f-a8fc-b2f3669a0b44` (UUID swojego wydarzenia)
- user_id: `32373b34-4b94-4cbc-973b-949c6659cbee` (twoje user_id)

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
```

**Headers:**

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:** brak

**Body:** brak (GET nie używa body)

#### 3. Wyślij request (kliknij "Send")

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana struktura odpowiedzi:**
```json
{
  "id": "3cc6c482-e88f-496f-a8fc-b2f3669a0b44",
  "user_id": "32373b34-4b94-4cbc-973b-949c6659cbee",
  "created_by_authenticated_user": true,
  "title": "Koncert Chopina",
  "city": "Warszawa",
  "event_date": "2025-12-25",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Wieczór z Chopinem w Filharmonii Narodowej",
  "generated_description": "<OPIS_WYGENEROWANY_PRZEZ_AI>",
  "edited_description": null,
  "saved": false,
  "feedback": null,
  "model_version": "mock-v1.0.0",
  "created_at": "2025-10-17T12:00:00.000Z",
  "updated_at": "2025-10-17T12:00:00.000Z"
}
```

**Weryfikacja:**
- Status HTTP = 200
- `id` zgadza się z UUID w URL
- `user_id` = twoje user_id z tokenu
- `created_by_authenticated_user` = true
- Wszystkie pola wydarzenia są obecne (w tym `model_version` - w przeciwieństwie do GET /api/events)
- `generated_description` zawiera opis AI
- `created_at` i `updated_at` są timestamp'ami ISO 8601

---

## PRZYPADEK TESTOWY 2: Próba pobrania wydarzenia innego użytkownika (Błąd - 404)

### Opis
Próba pobrania wydarzenia, które należy do innego użytkownika. RLS powinno zablokować dostęp i zwrócić 404.

### Dane testowe
- Event ID: UUID wydarzenia utworzonego przez innego użytkownika
- Aktualny user: `32373b34-4b94-4cbc-973b-949c6659cbee`

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/<UUID_WYDARZENIA_INNEGO_UŻYTKOWNIKA>
```

**Headers:**

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

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
- RLS (Row Level Security) filtruje wyniki po `user_id = auth.uid()`
- Supabase zwraca błąd PGRST116 (no rows returned)
- Serwis mapuje to na 404 z kodem `EVENT_NOT_FOUND`
- Z punktu widzenia użytkownika wydarzenie "nie istnieje" (bezpieczeństwo - nie ujawniamy czy ID istnieje w systemie)

---

## PRZYPADEK TESTOWY 3: Próba pobrania wydarzenia gościa (Błąd - 404)

### Opis
Próba pobrania wydarzenia utworzonego przez gościa (user_id = null). RLS blokuje dostęp.

### Dane testowe
- Event ID: UUID wydarzenia utworzonego bez tokenu (przez gościa)
- user_id wydarzenia: `null`

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/<UUID_WYDARZENIA_GOŚCIA>
```

**Headers:**

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

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
- Wydarzenie ma `user_id = null`
- Query filtruje `.eq("user_id", userId)` gdzie userId = twoje ID
- `null` ≠ twoje UUID → Supabase nie zwraca wiersza
- Rezultat: 404

---

## PRZYPADEK TESTOWY 4: Brak tokenu autoryzacyjnego (Błąd - 401)

### Opis
Próba pobrania wydarzenia bez podania tokenu Bearer w nagłówku Authorization.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
```

**Headers:** (NIE dodawaj nagłówka Authorization!)

| Key | Value |
|-----|-------|
| - | - |

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

**Weryfikacja:**
- Status 401 (nie 403 ani 400!)
- Komunikat jasno wskazuje na brak autoryzacji
- Endpoint nie ujawnia czy ID istnieje (bezpieczeństwo)

---

## PRZYPADEK TESTOWY 5: Nieprawidłowy token autoryzacyjny (Błąd - 401)

### Opis
Próba pobrania wydarzenia z nieprawidłowym lub wygasłym tokenem Bearer.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
```

**Headers:**

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer invalid-token-abc123` |

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

**Wyjaśnienie:**
- `supabase.auth.getUser()` wykrywa nieprawidłowy token
- Zwraca błąd lub `user = null`
- Handler mapuje to na 401

---

## PRZYPADEK TESTOWY 6: Nieprawidłowy format UUID (Błąd - 400)

### Opis
Próba pobrania wydarzenia z ID w nieprawidłowym formacie (nie jest UUID v4).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/nieprawidlowy-uuid-123
```

**Headers:**

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

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

**Weryfikacja:**
- Status 400 (nie 404!)
- Walidacja UUID odbywa się przed zapytaniem do bazy
- Pole `details` zawiera szczegóły błędu walidacji

---

## PRZYPADEK TESTOWY 7: Nieistniejące UUID (Błąd - 404)

### Opis
Próba pobrania wydarzenia z prawidłowym formatem UUID, ale ID nie istnieje w bazie danych.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/00000000-0000-0000-0000-000000000000
```

**Uwaga:** To prawidłowy UUID, ale prawdopodobnie nie istnieje w bazie.

**Headers:**

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

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
- UUID jest prawidłowy (walidacja przeszła)
- Supabase wykonuje query ale nie znajduje wiersza
- Błąd PGRST116 → mapowany na 404

---

## PRZYPADEK TESTOWY 8: Pobranie wydarzenia z edytowanym opisem (Sukces - 200)

### Opis
Pobranie wydarzenia, które ma ustawione `edited_description`.

### Przygotowanie
1. Utwórz wydarzenie (POST /api/events)
2. Zaktualizuj je dodając `edited_description` (PATCH /api/events/:id)
3. Zapisz UUID

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/<UUID_WYDARZENIA_Z_EDYCJĄ>
```

**Headers:**

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Weryfikacja kluczowych pól:**
```json
{
  "id": "<UUID>",
  "generated_description": "<ORYGINALNY_OPIS_AI>",
  "edited_description": "<EDYTOWANY_OPIS_UŻYTKOWNIKA>",
  ...
}
```

**Weryfikacja:**
- Pole `generated_description` zawiera oryginalny opis (niezmienialny)
- Pole `edited_description` zawiera opis edytowany przez użytkownika
- Oba opisy są zwracane w odpowiedzi

---

## PRZYPADEK TESTOWY 9: Pobranie zapisanego wydarzenia z feedbackiem (Sukces - 200)

### Opis
Pobranie wydarzenia, które zostało zapisane i ocenione przez użytkownika.

### Przygotowanie
1. Utwórz wydarzenie
2. Oznacz jako zapisane: PATCH z `{"saved": true, "feedback": "thumbs_up"}`
3. Zapisz UUID

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:3000/api/events/<UUID_ZAPISANEGO_WYDARZENIA>
```

**Headers:**

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Weryfikacja kluczowych pól:**
```json
{
  "id": "<UUID>",
  "saved": true,
  "feedback": "thumbs_up",
  "updated_at": "<TIMESTAMP_PÓŹNIEJSZY_NIŻ_CREATED_AT>",
  ...
}
```

**Weryfikacja:**
- `saved` = true
- `feedback` = "thumbs_up" lub "thumbs_down"
- `updated_at` jest późniejsze niż `created_at` (został zaktualizowany)

---

## PRZYPADEK TESTOWY 10: Curl - Pobranie wydarzenia (Sukces - 200)

### Opis
Test tego samego endpointu używając curl (alternatywa dla Postmana).

### Kroki wykonania

#### 1. Otwórz terminal (PowerShell lub CMD)

#### 2. Wykonaj polecenie

```bash
curl -X GET "http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44" `
  -H "Authorization: Bearer <TWÓJ_ACCESS_TOKEN>"
```

**Uwaga dla PowerShell:** Użyj backtick (`) do łamania linii.

#### 3. Weryfikacja odpowiedzi

**Oczekiwany output:**
```json
{
  "id": "3cc6c482-e88f-496f-a8fc-b2f3669a0b44",
  "user_id": "32373b34-4b94-4cbc-973b-949c6659cbee",
  "title": "Koncert Chopina",
  ...
}
```

---

## Podsumowanie testów

### Matryca przypadków testowych

| Test | Typ | Scenariusz | Oczekiwany status | Oczekiwany rezultat |
|------|-----|-----------|-------------------|---------------------|
| 1 | ✅ Pozytywny | Pobranie swojego wydarzenia | 200 | Pełny obiekt EventResponseDTO |
| 2 | ❌ Negatywny | Wydarzenie innego użytkownika | 404 | Event not found (RLS) |
| 3 | ❌ Negatywny | Wydarzenie gościa (user_id=null) | 404 | Event not found (RLS) |
| 4 | ❌ Negatywny | Brak tokenu | 401 | Unauthorized |
| 5 | ❌ Negatywny | Nieprawidłowy token | 401 | Unauthorized |
| 6 | ❌ Negatywny | Nieprawidłowy format UUID | 400 | Validation error |
| 7 | ❌ Negatywny | Nieistniejące UUID | 404 | Event not found |
| 8 | ✅ Pozytywny | Wydarzenie z edytowanym opisem | 200 | Oba opisy w odpowiedzi |
| 9 | ✅ Pozytywny | Zapisane wydarzenie z feedbackiem | 200 | saved=true, feedback obecny |
| 10 | ✅ Pozytywny | Test z curl (alternatywa) | 200 | Pełny obiekt wydarzenia |

### Legenda statusów HTTP

- **200 OK** - Sukces, zwrócono szczegóły wydarzenia
- **400 Bad Request** - Błąd walidacji UUID
- **401 Unauthorized** - Brak tokenu lub nieprawidłowy token
- **404 Not Found** - Wydarzenie nie istnieje lub nie należy do użytkownika (RLS)
- **500 Internal Server Error** - Nieoczekiwany błąd serwera (nie powinien wystąpić)

### Różnice między GET /api/events/:id a GET /api/events

| Właściwość | GET /api/events/:id | GET /api/events |
|-----------|---------------------|-----------------|
| **Zwraca** | Pojedyncze wydarzenie | Lista wydarzeń |
| **Pole model_version** | ✅ Obecne | ❌ Usunięte (optymalizacja) |
| **Paginacja** | ❌ Nie | ✅ Tak |
| **Filtrowanie** | ❌ Nie (tylko ID) | ✅ Tak (saved, category, age_category) |
| **Sortowanie** | ❌ Nie | ✅ Tak (created_at, event_date, title) |
| **Use case** | Szczegóły konkretnego wydarzenia | Lista z filtrowaniem |

### Uwagi końcowe

1. **Autoryzacja wymagana** - Endpoint NIE obsługuje dostępu dla gości (w przeciwieństwie do POST /api/events).

2. **RLS + explicit filter** - Podwójne zabezpieczenie:
   - RLS automatycznie filtruje po `user_id = auth.uid()`
   - Explicit `.eq("user_id", userId)` jako defense-in-depth

3. **404 zamiast 403** - Gdy wydarzenie nie należy do użytkownika, zwracamy 404 (nie ujawniamy czy ID istnieje).

4. **Pole model_version obecne** - W przeciwieństwie do GET /api/events, tutaj zwracamy `model_version` (pełny obiekt).

5. **Query Supabase:** `.select().eq("id", eventId).eq("user_id", userId).single()`
   - `.single()` gwarantuje max 1 rekord lub błąd PGRST116

6. **Wydajność:**
   - SELECT po primary key (`id`) + indexed `user_id` - bardzo szybkie
   - Brak JOIN-ów, bezpośredni SELECT

7. **Bezpieczeństwo:**
   - Walidacja UUID zapobiega SQL injection
   - RLS blokuje dostęp do cudzych wydarzeń
   - 404 zamiast szczegółów błędu (timing attack protection)

8. **Brak logowania** - Pobieranie wydarzenia NIE jest logowane w `event_management_logs` (tylko odczyt).

9. **Token wygasa po 1 godzinie** - Jeśli otrzymasz 401, wykonaj ponownie krok przygotowania i uzyskaj nowy token.

10. **Różnica vs GET /api/events:**
    - GET /api/events/:id - szczegóły pojedynczego wydarzenia (z `model_version`)
    - GET /api/events - lista wydarzeń z filtrowaniem i paginacją (bez `model_version`)

---

## Dodatkowe scenariusze testowe (opcjonalne)

### Test: Sprawdzenie izolacji RLS

1. Zaloguj się jako użytkownik A
2. Utwórz wydarzenie jako A (zapisz UUID)
3. Zaloguj się jako użytkownik B
4. Spróbuj pobrać wydarzenie A używając tokenu B
5. Oczekiwany rezultat: **404 Not Found**

### Test: Timestamp'y created_at i updated_at

1. Utwórz wydarzenie (POST /api/events)
2. Pobierz wydarzenie (GET /api/events/:id)
3. Sprawdź czy `created_at` === `updated_at` (wydarzenie nie było edytowane)
4. Zaktualizuj wydarzenie (PATCH /api/events/:id)
5. Pobierz ponownie (GET /api/events/:id)
6. Sprawdź czy `updated_at` > `created_at`

### Test: Wszystkie pola DTO

Sprawdź czy odpowiedź zawiera wszystkie pola z `EventResponseDTO`:
- `id` (UUID)
- `user_id` (UUID lub null)
- `created_by_authenticated_user` (boolean)
- `title` (string)
- `city` (string)
- `event_date` (date)
- `category` (enum)
- `age_category` (enum)
- `key_information` (string)
- `generated_description` (string)
- `edited_description` (string lub null)
- `saved` (boolean)
- `feedback` (enum lub null)
- `model_version` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

````
