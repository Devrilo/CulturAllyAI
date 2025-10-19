# Testy Manualne: PATCH /api/events/{id}

## Przygotowanie środowiska testowego

### Wymagania wstępne
- Uruchomiony lokalny Supabase (`supabase start`)
- Aplikacja uruchomiona na `http://localhost:3000`
- Zainstalowany Postman

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

## PRZYPADEK TESTOWY 1A: Próba aktualizacji wydarzenia gościa (Błąd - 404)

### Opis
Próba aktualizacji wydarzenia utworzonego przez niezalogowanego użytkownika (gościa). 
Powinno zakończyć się błędem 404, ponieważ RLS nie pozwoli na znalezienie wydarzenia należącego do innego użytkownika.

### Dane testowe
- Event ID: `50a5338b-18a2-4454-bf1e-ec379a2dd046`
- created_by_authenticated_user: `false`
- user_id: `NULL`

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/50a5338b-18a2-4454-bf1e-ec379a2dd046
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN_Z_KROKU_PRZYGOTOWANIA>
```

**Body (raw JSON):**
```json
{
  "saved": true
}
```

#### 3. Wyślij request (kliknij "Send")

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
RLS (Row Level Security) blokuje dostęp do wydarzeń gości. Wydarzenie istnieje w bazie, ale z punktu widzenia zalogowanego użytkownika "nie istnieje", ponieważ `user_id` nie pasuje.

---

## PRZYPADEK TESTOWY 1B: Brak możliwości aktualizacji - nieprawidłowy UUID (Błąd - 400)

### Opis
Próba aktualizacji wydarzenia z nieprawidłowym formatem ID (nie jest to poprawny UUID).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/nieprawidlowy-uuid-123
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Body (raw JSON):**
```json
{
  "saved": true
}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**
```json
{
  "error": "Validation Error",
  "message": "Przesłano nieprawidłowy identyfikator wydarzenia",
  "details": [
    {
      "field": "id",
      "message": "Identyfikator wydarzenia musi być prawidłowym UUID"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 2A: Próba aktualizacji wydarzenia z usuniętego konta (Błąd - 403)

### Opis
Próba aktualizacji wydarzenia, które zostało utworzone przez zalogowanego użytkownika, ale konto zostało usunięte.
Wydarzenie ma `created_by_authenticated_user = TRUE` ale `user_id = NULL`.

### Dane testowe
- Event ID: `5af88917-3f9d-41b8-9af8-67f9ac1d4418`
- created_by_authenticated_user: `true`
- user_id: `NULL`

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/5af88917-3f9d-41b8-9af8-67f9ac1d4418
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Body (raw JSON):**
```json
{
  "feedback": "thumbs_up"
}
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
RLS blokuje dostęp, ponieważ `user_id = NULL` nie pasuje do zalogowanego użytkownika.

---

## PRZYPADEK TESTOWY 2B: Próba aktualizacji bez tokenu autoryzacyjnego (Błąd - 401)

### Opis
Próba aktualizacji wydarzenia bez podania tokenu autoryzacyjnego.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
```

**Headers:**
```
Content-Type: application/json
```
**UWAGA:** Nie dodawaj headera `Authorization`!

**Body (raw JSON):**
```json
{
  "saved": true
}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `401 Unauthorized`

**Oczekiwana odpowiedź:**
```json
{
  "error": "Unauthorized",
  "message": "Brak autoryzacji do wykonania tej operacji"
}
```

---

## PRZYPADEK TESTOWY 3A: Aktualizacja pól saved i feedback (Sukces - 200)

### Opis
Aktualizacja wydarzenia, które należy do zalogowanego użytkownika.
Wydarzenie ma `saved = false` i `feedback = null`, więc możemy zaktualizować oba pola.

### Dane testowe
- Event ID: `3cc6c482-e88f-496f-a8fc-b2f3669a0b44`
- created_by_authenticated_user: `true`
- user_id: `32373b34-4b94-4cbc-973b-949c6659cbee`
- saved: `false`
- feedback: `null`

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Body (raw JSON):**
```json
{
  "saved": true,
  "feedback": "thumbs_down"
}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana struktura odpowiedzi:**
```json
{
  "id": "3cc6c482-e88f-496f-a8fc-b2f3669a0b44",
  "user_id": "32373b34-4b94-4cbc-973b-949c6659cbee",
  "created_by_authenticated_user": true,
  "title": "Jazz Night w Filharmonii Poznańskiej",
  "city": "Poznań",
  "event_date": "2025-11-15",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Występ The Dave Brubeck Quartet Tribute Band. Bilety dostępne w kasie filharmonii oraz online. Cena: 80-120 zł. Dress code: elegancki.",
  "generated_description": "Jazz Night w Filharmonii Poznańskiej odbędzie się w Poznaniu 15 listopada 2025...",
  "edited_description": null,
  "saved": true,
  "feedback": "thumbs_down",
  "model_version": "mock-v1.0.0",
  "created_at": "2025-10-17T21:48:08.895708+00:00",
  "updated_at": "<ZAKTUALIZOWANA_DATA>"
}
```

**Weryfikacja:**
- `saved` powinno być `true`
- `feedback` powinno być `"thumbs_down"`
- `updated_at` powinno mieć nową datę (późniejszą niż created_at)

---

## PRZYPADEK TESTOWY 3B: Próba aktualizacji z pustym body (Błąd - 400)

### Opis
Próba aktualizacji wydarzenia bez podania żadnych pól do zmiany.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/3cc6c482-e88f-496f-a8fc-b2f3669a0b44
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Body (raw JSON):**
```json
{}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**
```json
{
  "error": "Validation Error",
  "message": "Dane wejściowe są nieprawidłowe",
  "details": [
    {
      "field": "body",
      "message": "Należy podać co najmniej jedno pole do aktualizacji"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 4A: Aktualizacja tylko pola saved gdy feedback już istnieje (Sukces - 200)

### Opis
Aktualizacja wydarzenia, które ma już ustawioną wartość `feedback`.
Możemy zmienić tylko pole `saved`.

### Dane testowe
- Event ID: `3e11b5de-7733-4ffd-b454-82b9dbe00777`
- created_by_authenticated_user: `true`
- user_id: `32373b34-4b94-4cbc-973b-949c6659cbee`
- saved: `false`
- feedback: `thumbs_up`

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/3e11b5de-7733-4ffd-b454-82b9dbe00777
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Body (raw JSON):**
```json
{
  "saved": true
}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Weryfikacja kluczowych pól:**
```json
{
  "id": "3e11b5de-7733-4ffd-b454-82b9dbe00777",
  "saved": true,
  "feedback": "thumbs_up",
  "edited_description": null,
  ...
}
```

**Weryfikacja:**
- `saved` powinno być `true` (zmienione z `false`)
- `feedback` powinno pozostać `"thumbs_up"` (bez zmian)
- `edited_description` powinno pozostać `null`

---

## PRZYPADEK TESTOWY 4B: Próba zmiany feedback na nieprawidłową wartość (Błąd - 400)

### Opis
Próba ustawienia nieprawidłowej wartości dla pola `feedback` (dozwolone: `thumbs_up`, `thumbs_down`, `null`).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/3e11b5de-7733-4ffd-b454-82b9dbe00777
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Body (raw JSON):**
```json
{
  "feedback": "invalid_value"
}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**
```json
{
  "error": "Validation Error",
  "message": "Dane wejściowe są nieprawidłowe",
  "details": [
    {
      "field": "feedback",
      "message": "Nieprawidłowa wartość opinii"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 5A: Aktualizacja edited_description i saved dla zapisanego wydarzenia (Sukces - 200)

### Opis
Aktualizacja wydarzenia, które jest już zapisane (`saved = true`).
Możemy dodać lub zmienić `edited_description` oraz zmienić status `saved`.

### Dane testowe
- Event ID: `c774ab0f-306a-4195-95fd-34fdd5c65468`
- created_by_authenticated_user: `true`
- user_id: `32373b34-4b94-4cbc-973b-949c6659cbee`
- saved: `true`
- edited_description: `null`

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/c774ab0f-306a-4195-95fd-34fdd5c65468
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Body (raw JSON):**
```json
{
  "edited_description": "To jest mój niestandardowy, edytowany opis wydarzenia. Zmieniam go, ponieważ wygenerowany opis nie do końca mi odpowiada.",
  "saved": false
}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Weryfikacja kluczowych pól:**
```json
{
  "id": "c774ab0f-306a-4195-95fd-34fdd5c65468",
  "saved": false,
  "edited_description": "To jest mój niestandardowy, edytowany opis wydarzenia. Zmieniam go, ponieważ wygenerowany opis nie do końca mi odpowiada.",
  "generated_description": "TEST2 TEST2 TEST2",
  "feedback": null,
  ...
}
```

**Weryfikacja:**
- `saved` powinno być `false` (zmienione z `true`)
- `edited_description` powinno zawierać nowy tekst
- `generated_description` pozostaje bez zmian (niezmienialny)

---

## PRZYPADEK TESTOWY 5B: Próba aktualizacji z zbyt długim edited_description (Błąd - 400)

### Opis
Próba ustawienia zbyt długiej wartości dla pola `edited_description` (limit: 500 znaków).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `PATCH`

**URL:**
```
http://localhost:3000/api/events/c774ab0f-306a-4195-95fd-34fdd5c65468
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TWÓJ_ACCESS_TOKEN>
```

**Body (raw JSON):**
```json
{
  "edited_description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam"
}
```

**Uwaga:** Powyższy tekst ma więcej niż 500 znaków.

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**
```json
{
  "error": "Validation Error",
  "message": "Dane wejściowe są nieprawidłowe",
  "details": [
    {
      "field": "edited_description",
      "message": "Opis nie może przekraczać 500 znaków"
    }
  ]
}
```

---

## Podsumowanie testów

### Matryca przypadków testowych

| Test | Typ | Scenariusz | Event ID | Oczekiwany status | Oczekiwany rezultat |
|------|-----|-----------|----------|-------------------|---------------------|
| 1A | ❌ Negatywny | Próba aktualizacji wydarzenia gościa | `50a5338b...` | 404 | Event not found (RLS) |
| 1B | ❌ Negatywny | Nieprawidłowy format UUID | `nieprawidlowy-uuid-123` | 400 | Validation error |
| 2A | ❌ Negatywny | Wydarzenie z usuniętego konta | `5af88917...` | 404 | Event not found (RLS) |
| 2B | ❌ Negatywny | Brak tokenu autoryzacyjnego | `3cc6c482...` | 401 | Unauthorized |
| 3A | ✅ Pozytywny | Aktualizacja saved + feedback | `3cc6c482...` | 200 | Sukces |
| 3B | ❌ Negatywny | Pusty body (brak pól) | `3cc6c482...` | 400 | Validation error |
| 4A | ✅ Pozytywny | Aktualizacja tylko saved | `3e11b5de...` | 200 | Sukces |
| 4B | ❌ Negatywny | Nieprawidłowa wartość feedback | `3e11b5de...` | 400 | Validation error |
| 5A | ✅ Pozytywny | Aktualizacja edited_description + saved | `c774ab0f...` | 200 | Sukces |
| 5B | ❌ Negatywny | Za długi edited_description | `c774ab0f...` | 400 | Validation error |

### Legenda statusów HTTP

- **200 OK** - Sukces, wydarzenie zostało zaktualizowane
- **400 Bad Request** - Błąd walidacji danych wejściowych
- **401 Unauthorized** - Brak autoryzacji (brak tokenu lub nieprawidłowy token)
- **403 Forbidden** - Brak uprawnień do wykonania operacji
- **404 Not Found** - Wydarzenie nie zostało znalezione (lub brak dostępu przez RLS)
- **500 Internal Server Error** - Nieoczekiwany błąd serwera

### Uwagi końcowe

1. **Token wygasa po 1 godzinie** - jeśli otrzymasz błąd 401 podczas testowania, wykonaj ponownie krok przygotowania i uzyskaj nowy token.

2. **RLS (Row Level Security)** - Supabase automatycznie filtruje wyniki na podstawie polityk RLS. Jeśli wydarzenie nie należy do zalogowanego użytkownika, otrzymasz 404 zamiast 403.

3. **Pole updated_at** - Jest automatycznie aktualizowane przez trigger bazodanowy przy każdej modyfikacji rekordu.

4. **Logowanie akcji** - Każda udana aktualizacja jest zapisywana w tabeli `event_management_logs` dla celów audytowych:
   - Zmiana `saved` → loguje akcję `event_saved`
   - Zmiana `feedback` → loguje akcję `event_rated`
   - Zmiana `edited_description` → loguje akcję `event_edited`
   - Każda zmiana jest logowana osobno, więc aktualizacja wszystkich trzech pól utworzy trzy wpisy w logach

5. **Przywracanie stanu testowego** - Po wykonaniu testów pozytywnych (3A, 4A, 5A) możesz chcieć przywrócić oryginalne wartości w bazie danych, aby móc powtórzyć testy.

---

## Dodatkowe scenariusze testowe (opcjonalne)

### Test: Usunięcie edited_description (ustawienie null)

Możesz również przetestować scenariusz, w którym użytkownik chce usunąć swój edytowany opis i wrócić do wersji wygenerowanej przez AI:

```json
{
  "edited_description": null
}
```

Lub pustym stringiem (który zostanie przekonwertowany na null przez walidator):

```json
{
  "edited_description": ""
}
```

### Test: Zmiana feedback z thumbs_up na thumbs_down

```json
{
  "feedback": "thumbs_down"
}
```

### Test: Ustawienie feedback na null (usunięcie oceny)

```json
{
  "feedback": null
}
```

### Test: Próba zmiany niemodyfikowalnych pól

Możesz spróbować wysłać dodatkowe pola, które nie powinny być modyfikowane (np. `title`, `category`):

```json
{
  "saved": true,
  "title": "Nowy tytuł",
  "category": "teatr_i_taniec"
}
```

Oczekiwany rezultat: Endpoint zignoruje nieznane pola i zaktualizuje tylko `saved`.
