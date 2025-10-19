# Testy Manualne: POST /api/events

## Przygotowanie środowiska testowego

### Wymagania wstępne
- Uruchomiony lokalny Supabase (`supabase start`)
- Aplikacja uruchomiona na `http://localhost:3000`
- Zainstalowany Postman

### Konfiguracja Postmana - Uzyskanie tokenu dostępowego (OPCJONALNIE)

⚠️ **UWAGA:** Token jest **opcjonalny** dla tego endpointu! Możesz tworzyć wydarzenia jako:
- **Gość** (bez tokenu) - wydarzenie zostanie utworzone z `user_id = NULL`
- **Zalogowany użytkownik** (z tokenem) - wydarzenie będzie przypisane do użytkownika

#### Opcja A: Testowanie jako GOŚĆ (bez tokenu)

Nie musisz nic robić! Po prostu pomiń header `Authorization` w requestach.

#### Opcja B: Testowanie jako ZALOGOWANY UŻYTKOWNIK (z tokenem)

Jeśli chcesz przetestować utworzenie wydarzenia jako zalogowany użytkownik, wykonaj poniższe kroki:

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

**5. Send i skopiuj `access_token`**

---

## PRZYPADEK TESTOWY 1A: Utworzenie wydarzenia jako gość (Sukces - 201)

### Opis
Utworzenie nowego wydarzenia przez niezalogowanego użytkownika (gościa) ze wszystkimi poprawnymi danymi.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

⚠️ **UWAGA:** NIE dodawaj headera `Authorization`! To test dla gościa.

**Body (raw, JSON):**

```json
{
  "title": "Koncert Chopinowski w Filharmonii",
  "city": "Warszawa",
  "event_date": "2025-12-15T19:00:00Z",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Występ pianisty Rafała Blechacza. Bilety: 50-150 zł. Rozpoczęcie o 19:00. Dress code: elegancki."
}
```

#### 3. Wyślij request (kliknij "Send")

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `201 Created`

**Oczekiwana struktura odpowiedzi:**
```json
{
  "id": "<UUID>",
  "user_id": null,
  "created_by_authenticated_user": false,
  "title": "Koncert Chopinowski w Filharmonii",
  "city": "Warszawa",
  "event_date": "2025-12-15",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Występ pianisty Rafała Blechacza. Bilety: 50-150 zł. Rozpoczęcie o 19:00. Dress code: elegancki.",
  "generated_description": "<WYGENEROWANY_OPIS_PRZEZ_AI>",
  "edited_description": null,
  "saved": false,
  "feedback": null,
  "model_version": "mock-v1.0.0",
  "created_at": "<TIMESTAMP>",
  "updated_at": "<TIMESTAMP>"
}
```

**Weryfikacja:**
- `user_id` powinno być `null` (gość)
- `created_by_authenticated_user` powinno być `false`
- `generated_description` powinien zawierać opis wygenerowany przez AI
- `saved` powinno być `false`

---

## PRZYPADEK TESTOWY 1B: Utworzenie wydarzenia jako zalogowany użytkownik (Sukces - 201)

### Opis
Utworzenie wydarzenia przez zalogowanego użytkownika z tokenem autoryzacyjnym.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Body (raw, JSON):**

```json
{
  "title": "Wystawa Sztuki Współczesnej",
  "city": "Kraków",
  "event_date": "2025-11-20T10:00:00Z",
  "category": "sztuka_i_wystawy",
  "age_category": "wszystkie",
  "key_information": "Galeria Sztuki Nowoczesnej prezentuje prace młodych artystów. Wstęp wolny. Godziny otwarcia: 10-18."
}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `201 Created`

**Weryfikacja kluczowych pól:**
```json
{
  "id": "<UUID>",
  "user_id": "32373b34-4b94-4cbc-973b-949c6659cbee",
  "created_by_authenticated_user": true,
  "title": "Wystawa Sztuki Współczesnej",
  "city": "Kraków",
  ...
}
```

**Weryfikacja:**
- `user_id` powinno być UUID zalogowanego użytkownika (`32373b34-4b94-4cbc-973b-949c6659cbee`)
- `created_by_authenticated_user` powinno być `true`
- `generated_description` zawiera opis AI

---

## PRZYPADEK TESTOWY 2A: Brak wymaganego pola - title (Błąd - 400)

### Opis
Próba utworzenia wydarzenia bez podania obowiązkowego pola `title`.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{
  "city": "Gdańsk",
  "event_date": "2025-12-01T18:00:00Z",
  "category": "teatr_i_taniec",
  "age_category": "nastolatkowie",
  "key_information": "Spektakl teatralny dla młodzieży."
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
      "field": "title",
      "message": "Required"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 2B: Puste pole title (Błąd - 400)

### Opis
Próba utworzenia wydarzenia z pustym stringiem jako `title`.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{
  "title": "",
  "city": "Wrocław",
  "event_date": "2025-12-10T20:00:00Z",
  "category": "kino",
  "age_category": "dorosli",
  "key_information": "Projekcja filmowa klasyki."
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
      "field": "title",
      "message": "Tytuł jest wymagany"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 3A: Zbyt długi tytuł (Błąd - 400)

### Opis
Próba utworzenia wydarzenia z tytułem przekraczającym 100 znaków.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{
  "title": "To jest bardzo długi tytuł wydarzenia, który ma na celu przekroczenie limitu stu znaków, aby przetestować walidację maksymalnej długości tego pola",
  "city": "Poznań",
  "event_date": "2025-12-05T17:00:00Z",
  "category": "literatura",
  "age_category": "mlodzi_dorosli",
  "key_information": "Spotkanie autorskie z pisarzem."
}
```

**Uwaga:** Powyższy tytuł ma więcej niż 100 znaków.

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
      "field": "title",
      "message": "Tytuł nie może przekraczać 100 znaków"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 3B: Zbyt długie key_information (Błąd - 400)

### Opis
Próba utworzenia wydarzenia z `key_information` przekraczającym 200 znaków.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{
  "title": "Festiwal Muzyczny",
  "city": "Katowice",
  "event_date": "2025-11-25T16:00:00Z",
  "category": "festiwale",
  "age_category": "wszystkie",
  "key_information": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate."
}
```

**Uwaga:** Pole `key_information` ma więcej niż 200 znaków.

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
      "field": "key_information",
      "message": "Kluczowe informacje nie mogą przekraczać 200 znaków"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 4A: Nieprawidłowa kategoria wydarzenia (Błąd - 400)

### Opis
Próba utworzenia wydarzenia z nieprawidłową wartością `category` (niezgodną z enumem).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{
  "title": "Wydarzenie testowe",
  "city": "Łódź",
  "event_date": "2025-11-30T19:00:00Z",
  "category": "nieprawidlowa_kategoria",
  "age_category": "dorosli",
  "key_information": "Test walidacji kategorii."
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
      "field": "category",
      "message": "Nieprawidłowa kategoria wydarzenia"
    }
  ]
}
```

**Prawidłowe wartości:** `koncerty`, `imprezy`, `teatr_i_taniec`, `sztuka_i_wystawy`, `literatura`, `kino`, `festiwale`, `inne`

---

## PRZYPADEK TESTOWY 4B: Nieprawidłowa kategoria wiekowa (Błąd - 400)

### Opis
Próba utworzenia wydarzenia z nieprawidłową wartością `age_category`.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{
  "title": "Spektakl dla dzieci",
  "city": "Szczecin",
  "event_date": "2025-12-08T15:00:00Z",
  "category": "teatr_i_taniec",
  "age_category": "invalid_age",
  "key_information": "Interaktywny teatrzyk dla najmłodszych."
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
      "field": "age_category",
      "message": "Nieprawidłowa kategoria wiekowa"
    }
  ]
}
```

**Prawidłowe wartości:** `wszystkie`, `najmlodsi`, `dzieci`, `nastolatkowie`, `mlodzi_dorosli`, `dorosli`, `osoby_starsze`

---

## PRZYPADEK TESTOWY 5A: Data w przeszłości (Błąd - 400)

### Opis
Próba utworzenia wydarzenia z datą, która już minęła.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{
  "title": "Wydarzenie archiwalne",
  "city": "Gdynia",
  "event_date": "2020-01-01T12:00:00Z",
  "category": "koncerty",
  "age_category": "wszystkie",
  "key_information": "Test daty w przeszłości."
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
      "field": "event_date",
      "message": "Data wydarzenia nie może być w przeszłości"
    }
  ]
}
```

---

## PRZYPADEK TESTOWY 5B: Nieprawidłowy format daty (Błąd - 400)

### Opis
Próba utworzenia wydarzenia z datą w nieprawidłowym formacie (nie ISO 8601).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{
  "title": "Wydarzenie z błędną datą",
  "city": "Bydgoszcz",
  "event_date": "2025/12/25 18:00",
  "category": "imprezy",
  "age_category": "mlodzi_dorosli",
  "key_information": "Test formatu daty."
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
      "field": "event_date",
      "message": "Data musi być w formacie ISO 8601"
    }
  ]
}
```

**Prawidłowy format:** `YYYY-MM-DDTHH:MM:SSZ` (np. `2025-12-25T18:00:00Z`)

---

## PRZYPADEK TESTOWY 6A: Nieprawidłowy JSON w body (Błąd - 400)

### Opis
Próba wysłania requestu z niepoprawnie sformatowanym JSON.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```
{
  "title": "Test",
  "city": "Toruń",
  "event_date": "2025-12-20T19:00:00Z",
  "category": "koncerty",
  "age_category": "dorosli",
  "key_information": "Test"
  // To jest nieprawidłowy JSON z komentarzem
}
```

**Uwaga:** Powyższy JSON jest nieprawidłowy (zawiera komentarz).

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**
```json
{
  "error": "Invalid JSON",
  "message": "Treść żądania nie jest poprawnym JSON"
}
```

---

## PRZYPADEK TESTOWY 6B: Nieprawidłowy token autoryzacyjny (Błąd - 401)

### Opis
Próba utworzenia wydarzenia z nieprawidłowym tokenem w headerze `Authorization`.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**
```
http://localhost:3000/api/events
```

**Headers:**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer invalid-token-12345` |

**Body (raw, JSON):**

```json
{
  "title": "Wydarzenie z nieprawidłowym tokenem",
  "city": "Olsztyn",
  "event_date": "2025-12-18T20:00:00Z",
  "category": "kino",
  "age_category": "nastolatkowie",
  "key_information": "Test nieprawidłowego tokenu."
}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `401 Unauthorized`

**Oczekiwana odpowiedź:**
```json
{
  "error": "Unauthorized",
  "message": "Token autoryzacji jest nieprawidłowy"
}
```

---

## Podsumowanie testów

### Matryca przypadków testowych

| Test | Typ | Scenariusz | Oczekiwany status | Oczekiwany rezultat |
|------|-----|-----------|-------------------|---------------------|
| 1A | ✅ Pozytywny | Utworzenie wydarzenia jako gość | 201 | Event created (user_id=null) |
| 1B | ✅ Pozytywny | Utworzenie jako zalogowany użytkownik | 201 | Event created (user_id=UUID) |
| 2A | ❌ Negatywny | Brak pola title | 400 | Validation error |
| 2B | ❌ Negatywny | Pusty title | 400 | Validation error |
| 3A | ❌ Negatywny | Zbyt długi tytuł (>100 znaków) | 400 | Validation error |
| 3B | ❌ Negatywny | Zbyt długie key_information (>200) | 400 | Validation error |
| 4A | ❌ Negatywny | Nieprawidłowa category | 400 | Validation error |
| 4B | ❌ Negatywny | Nieprawidłowa age_category | 400 | Validation error |
| 5A | ❌ Negatywny | Data w przeszłości | 400 | Validation error |
| 5B | ❌ Negatywny | Nieprawidłowy format daty | 400 | Validation error |
| 6A | ❌ Negatywny | Nieprawidłowy JSON | 400 | Invalid JSON |
| 6B | ❌ Negatywny | Nieprawidłowy token | 401 | Unauthorized |

### Legenda statusów HTTP

- **201 Created** - Sukces, wydarzenie zostało utworzone
- **400 Bad Request** - Błąd walidacji danych wejściowych
- **401 Unauthorized** - Nieprawidłowy token autoryzacyjny
- **503 Service Unavailable** - Błąd generowania opisu przez AI (rzadkie)
- **500 Internal Server Error** - Nieoczekiwany błąd serwera

### Dozwolone wartości dla pól enum

#### `category` (kategoria wydarzenia):
- `koncerty`
- `imprezy`
- `teatr_i_taniec`
- `sztuka_i_wystawy`
- `literatura`
- `kino`
- `festiwale`
- `inne`

#### `age_category` (kategoria wiekowa):
- `wszystkie`
- `najmlodsi`
- `dzieci`
- `nastolatkowie`
- `mlodzi_dorosli`
- `dorosli`
- `osoby_starsze`

### Limity długości pól

| Pole | Min | Max | Wymagane |
|------|-----|-----|----------|
| `title` | 1 | 100 | ✅ Tak |
| `city` | 1 | 50 | ✅ Tak |
| `event_date` | - | - | ✅ Tak (ISO 8601, przyszłość) |
| `category` | - | - | ✅ Tak (enum) |
| `age_category` | - | - | ✅ Tak (enum) |
| `key_information` | 1 | 200 | ✅ Tak |

### Uwagi końcowe

1. **Token jest opcjonalny** - Endpoint działa zarówno dla gości, jak i zalogowanych użytkowników.

2. **Format daty ISO 8601** - Data musi być w formacie `YYYY-MM-DDTHH:MM:SSZ`, np. `2025-12-31T23:59:59Z`.

3. **Walidacja daty** - Data nie może być w przeszłości. Porównanie odbywa się na poziomie dni (godzina jest ignorowana).

4. **Trim pól tekstowych** - Pola `title`, `city` i `key_information` są automatycznie "trimowane" (usuwane białe znaki z początku i końca).

5. **Generowanie opisu AI** - Po walidacji danych, endpoint automatycznie generuje opis wydarzenia za pomocą AI. Opis jest zwracany w polu `generated_description`.

6. **Logowanie akcji** - Każde utworzone wydarzenie jest logowane w tabeli `event_management_logs` z akcją `event_created`.

7. **RLS (Row Level Security)** - Nie ma wpływu na tworzenie wydarzeń. Każdy może utworzyć wydarzenie (jako gość lub zalogowany użytkownik).

---

## Dodatkowe scenariusze testowe (opcjonalne)

### Test: Wszystkie kategorie wydarzeń

Możesz przetestować każdą kategorię z enuma:

```json
{
  "title": "Test kategorii: Teatr i Taniec",
  "city": "Poznań",
  "event_date": "2025-12-10T19:00:00Z",
  "category": "teatr_i_taniec",
  "age_category": "wszystkie",
  "key_information": "Test wszystkich możliwych kategorii."
}
```

### Test: Wszystkie kategorie wiekowe

```json
{
  "title": "Wydarzenie dla najmłodszych",
  "city": "Warszawa",
  "event_date": "2025-12-12T10:00:00Z",
  "category": "inne",
  "age_category": "najmlodsi",
  "key_information": "Test kategorii wiekowej."
}
```

### Test: Minimalna długość pól

```json
{
  "title": "A",
  "city": "B",
  "event_date": "2025-12-31T23:59:59Z",
  "category": "inne",
  "age_category": "wszystkie",
  "key_information": "C"
}
```

Oczekiwany rezultat: **201 Created** - wszystkie pola spełniają minimalne wymagania (1 znak).

### Test: Maksymalna długość pól

```json
{
  "title": "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt labore et",
  "city": "Konstantynopolitańczykowianeczka i okolice",
  "event_date": "2025-12-31T23:59:59Z",
  "category": "festiwale",
  "age_category": "osoby_starsze",
  "key_information": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris"
}
```

Oczekiwany rezultat: **201 Created** - tytuł (100 znaków), miasto (50 znaków), key_information (200 znaków).
