# Testy Manualne: GET /api/events

## Przygotowanie środowiska testowego

### Wymagania wstępne

- Uruchomiony lokalny Supabase (`supabase start`)
- Aplikacja uruchomiona na `http://localhost:3000`
- Zainstalowany Postman lub curl
- Utworzony użytkownik testowy z kilkoma wydarzeniami w bazie

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

| Key            | Value                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Content-Type` | `application/json`                                                                                                                                     |
| `apikey`       | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXPooJeXxjNni43kdQwgnWNReilDMblYTn_I0` |

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
  "user": { ... }
}
```

Skopiuj wartość `access_token` - będzie potrzebna we wszystkich testach poniżej.

#### Krok 2: Przygotuj testowe wydarzenia

Utwórz kilka wydarzeń testowych za pomocą `POST /api/events`:

**Wydarzenie 1 - Zapisane, kategoria: koncerty**

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

Następnie oznacz to wydarzenie jako zapisane (`PATCH /api/events/{id}`):

```bash
curl -X PATCH http://localhost:3000/api/events/<ID_WYDARZENIA> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TWÓJ_TOKEN>" \
  -d '{"saved": true}'
```

**Wydarzenie 2 - Niezapisane, kategoria: teatr_i_taniec**

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TWÓJ_TOKEN>" \
  -d '{
    "title": "Spektakl: Hamlet",
    "city": "Kraków",
    "event_date": "2025-11-15T18:00:00Z",
    "category": "teatr_i_taniec",
    "age_category": "nastolatkowie",
    "key_information": "Nowoczesna interpretacja klasyki Szekspira"
  }'
```

**Wydarzenie 3 - Zapisane, kategoria: sztuka_i_wystawy**

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TWÓJ_TOKEN>" \
  -d '{
    "title": "Wystawa Impresjonizmu",
    "city": "Gdańsk",
    "event_date": "2026-01-10T10:00:00Z",
    "category": "sztuka_i_wystawy",
    "age_category": "wszystkie",
    "key_information": "Dzieła Moneta, Renoira i Degasa"
  }'
```

Oznacz jako zapisane:

```bash
curl -X PATCH http://localhost:3000/api/events/<ID_WYDARZENIA> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TWÓJ_TOKEN>" \
  -d '{"saved": true}'
```

**Wydarzenie 4 - Niezapisane, kategoria: koncerty**

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TWÓJ_TOKEN>" \
  -d '{
    "title": "Koncert Rockowy",
    "city": "Wrocław",
    "event_date": "2025-10-30T20:00:00Z",
    "category": "koncerty",
    "age_category": "mlodzi_dorosli",
    "key_information": "Rockowa uczta dla fanów gitarowych riffów"
  }'
```

**Wydarzenie 5 - Zapisane, kategoria: dzieci**

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TWÓJ_TOKEN>" \
  -d '{
    "title": "Bajkowy Teatrzyk",
    "city": "Poznań",
    "event_date": "2025-12-05T14:00:00Z",
    "category": "teatr_i_taniec",
    "age_category": "dzieci",
    "key_information": "Interaktywny teatrzyk dla najmłodszych"
  }'
```

Oznacz jako zapisane:

```bash
curl -X PATCH http://localhost:3000/api/events/<ID_WYDARZENIA> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TWÓJ_TOKEN>" \
  -d '{"saved": true}'
```

Po wykonaniu tych kroków powinieneś mieć w bazie:

- **3 wydarzenia zapisane** (saved = true): Koncert Chopina, Wystawa Impresjonizmu, Bajkowy Teatrzyk
- **2 wydarzenia niezapisane** (saved = false): Hamlet, Koncert Rockowy
- **Różne kategorie**: koncerty (2), teatr_i_taniec (2), sztuka_i_wystawy (1)
- **Różne age_category**: dorosli, nastolatkowie, wszystkie, mlodzi_dorosli, dzieci

---

## PRZYPADEK TESTOWY 1: Pobranie wszystkich wydarzeń bez filtrów (Sukces - 200)

### Opis

Pobranie wszystkich wydarzeń użytkownika z domyślną paginacją (strona 1, limit 20).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:** (brak - używamy domyślnych wartości)

#### 3. Wyślij request (kliknij "Send")

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana struktura odpowiedzi:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "user_id": "32373b34-4b94-4cbc-973b-949c6659cbee",
      "created_by_authenticated_user": true,
      "title": "Koncert Chopina",
      "city": "Warszawa",
      "event_date": "2025-12-25",
      "category": "koncerty",
      "age_category": "dorosli",
      "key_information": "Wieczór z Chopinem w Filharmonii Narodowej",
      "generated_description": "<OPIS_AI>",
      "edited_description": null,
      "saved": true,
      "feedback": null,
      "created_at": "<TIMESTAMP>",
      "updated_at": "<TIMESTAMP>"
    },
    {
      "id": "<UUID>",
      "title": "Spektakl: Hamlet",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera wszystkie 5 wydarzeń użytkownika
- Pole `model_version` **NIE jest obecne** w obiektach (zostało usunięte)
- `pagination.page` = 1 (domyślnie)
- `pagination.limit` = 20 (domyślnie)
- `pagination.total` = 5 (łączna liczba wydarzeń)
- `pagination.total_pages` = 1 (5 wydarzeń / 20 na stronę = 1 strona)
- `pagination.has_next` = false (brak kolejnej strony)
- `pagination.has_prev` = false (jesteśmy na pierwszej stronie)
- Wydarzenia są posortowane według `created_at desc` (najnowsze pierwsze)

---

## PRZYPADEK TESTOWY 2: Filtrowanie po statusie zapisania - saved=true (Sukces - 200)

### Opis

Pobranie tylko wydarzeń, które zostały zapisane przez użytkownika.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?saved=true
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value  |
| ------- | ------ |
| `saved` | `true` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "title": "Koncert Chopina",
      "saved": true,
      ...
    },
    {
      "id": "<UUID>",
      "title": "Wystawa Impresjonizmu",
      "saved": true,
      ...
    },
    {
      "id": "<UUID>",
      "title": "Bajkowy Teatrzyk",
      "saved": true,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera tylko 3 wydarzenia
- Wszystkie wydarzenia mają `saved: true`
- `pagination.total` = 3
- Wydarzenia: Koncert Chopina, Wystawa Impresjonizmu, Bajkowy Teatrzyk

---

## PRZYPADEK TESTOWY 3: Filtrowanie po statusie zapisania - saved=false (Sukces - 200)

### Opis

Pobranie tylko wydarzeń, które NIE zostały zapisane (wersje robocze).

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?saved=false
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value   |
| ------- | ------- |
| `saved` | `false` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "title": "Spektakl: Hamlet",
      "saved": false,
      ...
    },
    {
      "id": "<UUID>",
      "title": "Koncert Rockowy",
      "saved": false,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera tylko 2 wydarzenia
- Wszystkie wydarzenia mają `saved: false`
- `pagination.total` = 2
- Wydarzenia: Hamlet, Koncert Rockowy

---

## PRZYPADEK TESTOWY 4: Filtrowanie po kategorii - category=koncerty (Sukces - 200)

### Opis

Pobranie tylko wydarzeń z kategorii "koncerty".

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?category=koncerty
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key        | Value      |
| ---------- | ---------- |
| `category` | `koncerty` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "title": "Koncert Chopina",
      "category": "koncerty",
      ...
    },
    {
      "id": "<UUID>",
      "title": "Koncert Rockowy",
      "category": "koncerty",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera tylko 2 wydarzenia
- Wszystkie wydarzenia mają `category: "koncerty"`
- `pagination.total` = 2

---

## PRZYPADEK TESTOWY 5: Filtrowanie po kategorii wiekowej - age_category=dzieci (Sukces - 200)

### Opis

Pobranie tylko wydarzeń przeznaczonych dla dzieci.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?age_category=dzieci
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key            | Value    |
| -------------- | -------- |
| `age_category` | `dzieci` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "title": "Bajkowy Teatrzyk",
      "age_category": "dzieci",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera tylko 1 wydarzenie
- Wydarzenie ma `age_category: "dzieci"`
- `pagination.total` = 1

---

## PRZYPADEK TESTOWY 6: Łączenie filtrów - saved=true + category=koncerty (Sukces - 200)

### Opis

Pobranie zapisanych wydarzeń tylko z kategorii "koncerty".

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?saved=true&category=koncerty
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key        | Value      |
| ---------- | ---------- |
| `saved`    | `true`     |
| `category` | `koncerty` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "title": "Koncert Chopina",
      "category": "koncerty",
      "saved": true,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera tylko 1 wydarzenie (Koncert Chopina)
- Wydarzenie ma `saved: true` AND `category: "koncerty"`
- `pagination.total` = 1
- Koncert Rockowy (saved=false) został przefiltrowany

---

## PRZYPADEK TESTOWY 7: Sortowanie po dacie wydarzenia - sort=event_date&order=asc (Sukces - 200)

### Opis

Pobranie wydarzeń posortowanych według daty wydarzenia (rosnąco - od najwcześniejszej).

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?sort=event_date&order=asc
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value        |
| ------- | ------------ |
| `sort`  | `event_date` |
| `order` | `asc`        |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Weryfikacja kolejności:**

```json
{
  "data": [
    {
      "title": "Koncert Rockowy",
      "event_date": "2025-10-30"
    },
    {
      "title": "Spektakl: Hamlet",
      "event_date": "2025-11-15"
    },
    {
      "title": "Bajkowy Teatrzyk",
      "event_date": "2025-12-05"
    },
    {
      "title": "Koncert Chopina",
      "event_date": "2025-12-25"
    },
    {
      "title": "Wystawa Impresjonizmu",
      "event_date": "2026-01-10"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Wydarzenia są posortowane według `event_date` rosnąco (najwcześniejsze pierwsze)
- Kolejność: 2025-10-30 → 2025-11-15 → 2025-12-05 → 2025-12-25 → 2026-01-10

---

## PRZYPADEK TESTOWY 8: Sortowanie po tytule - sort=title&order=asc (Sukces - 200)

### Opis

Pobranie wydarzeń posortowanych alfabetycznie według tytułu.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?sort=title&order=asc
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value   |
| ------- | ------- |
| `sort`  | `title` |
| `order` | `asc`   |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Weryfikacja kolejności:**

```json
{
  "data": [
    {
      "title": "Bajkowy Teatrzyk"
    },
    {
      "title": "Koncert Chopina"
    },
    {
      "title": "Koncert Rockowy"
    },
    {
      "title": "Spektakl: Hamlet"
    },
    {
      "title": "Wystawa Impresjonizmu"
    }
  ],
  ...
}
```

**Weryfikacja:**

- Wydarzenia są posortowane alfabetycznie według tytułu (A-Z)

---

## PRZYPADEK TESTOWY 9: Paginacja - strona 1 z limitem 2 (Sukces - 200)

### Opis

Pobranie pierwszej strony wyników z limitem 2 wydarzeń na stronę.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?page=1&limit=2
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value |
| ------- | ----- |
| `page`  | `1`   |
| `limit` | `2`   |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "title": "<NAJNOWSZE_WYDARZENIE_1>",
      ...
    },
    {
      "id": "<UUID>",
      "title": "<NAJNOWSZE_WYDARZENIE_2>",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 5,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera dokładnie 2 wydarzenia (pierwsze 2)
- `pagination.page` = 1
- `pagination.limit` = 2
- `pagination.total` = 5 (łącznie 5 wydarzeń)
- `pagination.total_pages` = 3 (ceil(5 / 2) = 3)
- `pagination.has_next` = true (istnieje strona 2)
- `pagination.has_prev` = false (jesteśmy na pierwszej stronie)

---

## PRZYPADEK TESTOWY 10: Paginacja - strona 2 z limitem 2 (Sukces - 200)

### Opis

Pobranie drugiej strony wyników z limitem 2 wydarzeń na stronę.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?page=2&limit=2
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value |
| ------- | ----- |
| `page`  | `2`   |
| `limit` | `2`   |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "title": "<WYDARZENIE_3>",
      ...
    },
    {
      "id": "<UUID>",
      "title": "<WYDARZENIE_4>",
      ...
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 2,
    "total": 5,
    "total_pages": 3,
    "has_next": true,
    "has_prev": true
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera wydarzenia 3-4 (offset: 2-3)
- `pagination.page` = 2
- `pagination.limit` = 2
- `pagination.total` = 5
- `pagination.total_pages` = 3
- `pagination.has_next` = true (istnieje strona 3)
- `pagination.has_prev` = true (istnieje strona 1)

---

## PRZYPADEK TESTOWY 11: Paginacja - ostatnia strona (Sukces - 200)

### Opis

Pobranie ostatniej strony wyników (częściowo wypełniona).

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?page=3&limit=2
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value |
| ------- | ----- |
| `page`  | `3`   |
| `limit` | `2`   |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [
    {
      "id": "<UUID>",
      "title": "<WYDARZENIE_5>",
      ...
    }
  ],
  "pagination": {
    "page": 3,
    "limit": 2,
    "total": 5,
    "total_pages": 3,
    "has_next": false,
    "has_prev": true
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera tylko 1 wydarzenie (ostatnie)
- `pagination.page` = 3
- `pagination.limit` = 2
- `pagination.total` = 5
- `pagination.total_pages` = 3
- `pagination.has_next` = false (to ostatnia strona)
- `pagination.has_prev` = true (istnieją poprzednie strony)

---

## PRZYPADEK TESTOWY 12: Paginacja - strona poza zakresem (Sukces - 200, pusta tablica)

### Opis

Próba pobrania strony, która nie istnieje (np. strona 10 gdy mamy tylko 3 strony).

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?page=10&limit=2
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value |
| ------- | ----- |
| `page`  | `10`  |
| `limit` | `2`   |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [],
  "pagination": {
    "page": 10,
    "limit": 2,
    "total": 5,
    "total_pages": 3,
    "has_next": false,
    "has_prev": true
  }
}
```

**Weryfikacja:**

- Tablica `data` jest pusta (nie ma błędu 404!)
- `pagination.page` = 10 (strona żądana)
- `pagination.total_pages` = 3 (faktyczna liczba stron)
- `pagination.has_next` = false
- `pagination.has_prev` = true

---

## PRZYPADEK TESTOWY 13: Maksymalny limit - limit=100 (Sukces - 200)

### Opis

Pobranie wydarzeń z maksymalnym dozwolonym limitem (100 na stronę).

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?limit=100
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value |
| ------- | ----- |
| `limit` | `100` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [ ... wszystkie 5 wydarzeń ... ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 5,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` zawiera wszystkie wydarzenia (max 100)
- `pagination.limit` = 100 (maksymalny dozwolony limit)
- `pagination.total_pages` = 1 (wszystkie wydarzenia zmieściły się na jednej stronie)

---

## PRZYPADEK TESTOWY 14: Limit przekraczający maksimum - limit=150 (Sukces - 200, limit obcięty do 100)

### Opis

Próba ustawienia limitu powyżej 100 (zostanie automatycznie obcięty do 100).

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?limit=150
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value |
| ------- | ----- |
| `limit` | `150` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [ ... wszystkie wydarzenia ... ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 5,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- `pagination.limit` = 100 (NIE 150! - zostało obcięte do maksimum)
- Request nie zwraca błędu 400, tylko automatycznie koryguje wartość

---

## PRZYPADEK TESTOWY 15: Brak tokenu autoryzacyjnego (Błąd - 401)

### Opis

Próba pobrania wydarzeń bez podania tokenu Bearer w nagłówku.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events
```

**Headers:** (NIE dodawaj nagłówka Authorization!)

| Key | Value |
| --- | ----- |
| -   | -     |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

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

---

## PRZYPADEK TESTOWY 16: Nieprawidłowy token autoryzacyjny (Błąd - 401)

### Opis

Próba pobrania wydarzeń z nieprawidłowym tokenem Bearer.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer invalid-token-12345` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `401 Unauthorized`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Unauthorized",
  "message": "Wymagana jest autoryzacja"
}
```

**Weryfikacja:**

- Status 401
- Użytkownik nie może uzyskać dostępu z nieprawidłowym tokenem

---

## PRZYPADEK TESTOWY 17: Nieprawidłowa kategoria wydarzenia (Błąd - 400)

### Opis

Próba filtrowania z nieprawidłową wartością parametru `category`.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?category=invalid_category
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key        | Value              |
| ---------- | ------------------ |
| `category` | `invalid_category` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Validation Error",
  "message": "Parametry zapytania są nieprawidłowe",
  "details": [
    {
      "field": "category",
      "message": "Nieprawidłowa kategoria wydarzenia"
    }
  ]
}
```

**Prawidłowe wartości category:**

- `koncerty`
- `imprezy`
- `teatr_i_taniec`
- `sztuka_i_wystawy`
- `literatura`
- `kino`
- `festiwale`
- `inne`

---

## PRZYPADEK TESTOWY 18: Nieprawidłowa kategoria wiekowa (Błąd - 400)

### Opis

Próba filtrowania z nieprawidłową wartością parametru `age_category`.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?age_category=invalid_age
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key            | Value         |
| -------------- | ------------- |
| `age_category` | `invalid_age` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Validation Error",
  "message": "Parametry zapytania są nieprawidłowe",
  "details": [
    {
      "field": "age_category",
      "message": "Nieprawidłowa kategoria wiekowa"
    }
  ]
}
```

**Prawidłowe wartości age_category:**

- `wszystkie`
- `najmlodsi`
- `dzieci`
- `nastolatkowie`
- `mlodzi_dorosli`
- `dorosli`
- `osoby_starsze`

---

## PRZYPADEK TESTOWY 19: Nieprawidłowe pole sortowania (Błąd - 400)

### Opis

Próba sortowania po polu, które nie jest dozwolone.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?sort=invalid_field
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key    | Value           |
| ------ | --------------- |
| `sort` | `invalid_field` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Validation Error",
  "message": "Parametry zapytania są nieprawidłowe",
  "details": [
    {
      "field": "sort",
      "message": "Nieprawidłowe pole sortowania"
    }
  ]
}
```

**Prawidłowe wartości sort:**

- `created_at` (domyślnie)
- `event_date`
- `title`

---

## PRZYPADEK TESTOWY 20: Nieprawidłowy kierunek sortowania (Błąd - 400)

### Opis

Próba ustawienia nieprawidłowego kierunku sortowania.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events?order=invalid_order
```

**Headers:**

| Key             | Value                        |
| --------------- | ---------------------------- |
| `Authorization` | `Bearer <TWÓJ_ACCESS_TOKEN>` |

**Query Parameters:**

| Key     | Value           |
| ------- | --------------- |
| `order` | `invalid_order` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `400 Bad Request`

**Oczekiwana odpowiedź:**

```json
{
  "error": "Validation Error",
  "message": "Parametry zapytania są nieprawidłowe",
  "details": [
    {
      "field": "order",
      "message": "Nieprawidłowy kierunek sortowania"
    }
  ]
}
```

**Prawidłowe wartości order:**

- `asc` (ascending - rosnąco A→Z, 1→9)
- `desc` (descending - malejąco Z→A, 9→1, domyślnie)

---

## PRZYPADEK TESTOWY 21: Pusta baza - użytkownik bez wydarzeń (Sukces - 200, pusta tablica)

### Opis

Pobranie wydarzeń dla użytkownika, który jeszcze nie utworzył żadnych wydarzeń.

### Przygotowanie

Zaloguj się jako nowy użytkownik, który nie ma żadnych wydarzeń w bazie.

### Kroki wykonania

#### 1. Skonfiguruj request w Postmanie

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events
```

**Headers:**

| Key             | Value                               |
| --------------- | ----------------------------------- |
| `Authorization` | `Bearer <TOKEN_NOWEGO_UŻYTKOWNIKA>` |

#### 2. Wyślij request

#### 3. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana odpowiedź:**

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "total_pages": 0,
    "has_next": false,
    "has_prev": false
  }
}
```

**Weryfikacja:**

- Tablica `data` jest pusta
- `pagination.total` = 0
- `pagination.total_pages` = 0
- Brak błędu 404! (to nie jest błąd, tylko brak danych)

---

## PRZYPADEK TESTOWY 22: Izolacja danych użytkowników (Sukces - 200)

### Opis

Weryfikacja, że użytkownik widzi tylko swoje wydarzenia (RLS działa poprawnie).

### Przygotowanie

1. Zaloguj się jako użytkownik A i utwórz wydarzenie "Event A"
2. Zaloguj się jako użytkownik B i utwórz wydarzenie "Event B"

### Kroki wykonania

#### 1. Pobierz wydarzenia jako użytkownik A

**Metoda:** `GET`

**URL:**

```
http://localhost:3000/api/events
```

**Headers:**

| Key             | Value                          |
| --------------- | ------------------------------ |
| `Authorization` | `Bearer <TOKEN_UŻYTKOWNIKA_A>` |

**Weryfikacja:**

- Tablica `data` zawiera tylko "Event A"
- Nie ma "Event B" (należy do innego użytkownika)

#### 2. Pobierz wydarzenia jako użytkownik B

**Headers:**

| Key             | Value                          |
| --------------- | ------------------------------ |
| `Authorization` | `Bearer <TOKEN_UŻYTKOWNIKA_B>` |

**Weryfikacja:**

- Tablica `data` zawiera tylko "Event B"
- Nie ma "Event A" (należy do innego użytkownika)

**Wniosek:** RLS (Row Level Security) działa poprawnie - każdy użytkownik widzi tylko swoje wydarzenia.

---

## Podsumowanie testów

### Matryca przypadków testowych

| Test | Typ          | Scenariusz                          | Oczekiwany status | Kluczowe weryfikacje           |
| ---- | ------------ | ----------------------------------- | ----------------- | ------------------------------ |
| 1    | ✅ Pozytywny | Pobranie wszystkich wydarzeń        | 200               | 5 wydarzeń, domyślna paginacja |
| 2    | ✅ Pozytywny | Filtrowanie: saved=true             | 200               | 3 zapisane wydarzenia          |
| 3    | ✅ Pozytywny | Filtrowanie: saved=false            | 200               | 2 niezapisane wydarzenia       |
| 4    | ✅ Pozytywny | Filtrowanie: category=koncerty      | 200               | 2 koncerty                     |
| 5    | ✅ Pozytywny | Filtrowanie: age_category=dzieci    | 200               | 1 wydarzenie dla dzieci        |
| 6    | ✅ Pozytywny | Łączenie filtrów (saved + category) | 200               | 1 zapisany koncert             |
| 7    | ✅ Pozytywny | Sortowanie: event_date asc          | 200               | Kolejność chronologiczna       |
| 8    | ✅ Pozytywny | Sortowanie: title asc               | 200               | Kolejność alfabetyczna         |
| 9    | ✅ Pozytywny | Paginacja: strona 1, limit 2        | 200               | 2 wydarzenia, has_next=true    |
| 10   | ✅ Pozytywny | Paginacja: strona 2, limit 2        | 200               | 2 wydarzenia, has_prev=true    |
| 11   | ✅ Pozytywny | Paginacja: ostatnia strona          | 200               | 1 wydarzenie, has_next=false   |
| 12   | ✅ Pozytywny | Paginacja: strona poza zakresem     | 200               | Pusta tablica, total_pages=3   |
| 13   | ✅ Pozytywny | Limit maksymalny (100)              | 200               | limit=100                      |
| 14   | ✅ Pozytywny | Limit > 100 (auto-obcięcie)         | 200               | limit obcięty do 100           |
| 15   | ❌ Negatywny | Brak tokenu                         | 401               | Unauthorized                   |
| 16   | ❌ Negatywny | Nieprawidłowy token                 | 401               | Unauthorized                   |
| 17   | ❌ Negatywny | Nieprawidłowa category              | 400               | Validation error               |
| 18   | ❌ Negatywny | Nieprawidłowa age_category          | 400               | Validation error               |
| 19   | ❌ Negatywny | Nieprawidłowe pole sort             | 400               | Validation error               |
| 20   | ❌ Negatywny | Nieprawidłowy kierunek order        | 400               | Validation error               |
| 21   | ✅ Edge Case | Użytkownik bez wydarzeń             | 200               | Pusta tablica, total=0         |
| 22   | ✅ Security  | Izolacja danych użytkowników        | 200               | RLS działa poprawnie           |

### Legenda statusów HTTP

- **200 OK** - Sukces, zwrócono listę wydarzeń (może być pusta)
- **400 Bad Request** - Błąd walidacji query parameters
- **401 Unauthorized** - Brak tokenu lub nieprawidłowy token
- **500 Internal Server Error** - Nieoczekiwany błąd serwera (nie powinien wystąpić)

### Dozwolone wartości dla query parameters

#### `saved` (boolean, opcjonalny):

- `true` - tylko zapisane wydarzenia
- `false` - tylko niezapisane wydarzenia
- brak parametru - wszystkie wydarzenia

#### `category` (enum, opcjonalny):

- `koncerty`
- `imprezy`
- `teatr_i_taniec`
- `sztuka_i_wystawy`
- `literatura`
- `kino`
- `festiwale`
- `inne`

#### `age_category` (enum, opcjonalny):

- `wszystkie`
- `najmlodsi`
- `dzieci`
- `nastolatkowie`
- `mlodzi_dorosli`
- `dorosli`
- `osoby_starsze`

#### `page` (integer, opcjonalny):

- Domyślnie: `1`
- Minimum: `1`
- Wartości < 1 są automatycznie korygowane do 1
- Wartości poza zakresem zwracają pustą tablicę (nie błąd 404!)

#### `limit` (integer, opcjonalny):

- Domyślnie: `20`
- Minimum: `1`
- Maksimum: `100` (wartości > 100 są automatycznie obcinane)

#### `sort` (string, opcjonalny):

- `created_at` (domyślnie) - data utworzenia
- `event_date` - data wydarzenia
- `title` - tytuł alfabetycznie

#### `order` (string, opcjonalny):

- `desc` (domyślnie) - malejąco (Z→A, 9→1, najnowsze pierwsze)
- `asc` - rosnąco (A→Z, 1→9, najstarsze pierwsze)

### Uwagi końcowe

1. **Autoryzacja jest wymagana** - Endpoint NIE obsługuje dostępu dla gości.

2. **RLS (Row Level Security)** - Użytkownik widzi tylko swoje wydarzenia. Automatyczna izolacja na poziomie bazy danych.

3. **Pole `model_version` jest usunięte** - W odpowiedzi nie ma pola `model_version` (optymalizacja rozmiaru odpowiedzi).

4. **Domyślne sortowanie** - Wydarzenia są sortowane według `created_at desc` (najnowsze pierwsze).

5. **Transformacje automatyczne:**
   - `saved`: string "true"/"false" → boolean true/false
   - `page`: string → number (min: 1)
   - `limit`: string → number (min: 1, max: 100)

6. **Pusta tablica ≠ błąd** - Jeśli użytkownik nie ma wydarzeń lub filtr nie zwraca wyników, zwracana jest pusta tablica z statusem 200 (NIE 404).

7. **Metadane paginacji zawsze obecne** - Nawet dla pustych wyników, obiekt `pagination` jest zawsze zwracany z poprawnymi wartościami.

8. **Wydajność zapytań:**
   - Count i data query wykonywane równolegle (Promise.all)
   - Wykorzystanie istniejących indeksów w bazie
   - LIMIT/OFFSET dla paginacji

9. **Limit bezpieczeństwa** - Maksymalny limit 100 wydarzeń na stronę chroni przed przeciążeniem serwera.

10. **Brak logowania akcji** - Pobieranie listy wydarzeń NIE jest logowane w `event_management_logs` (to tylko odczyt).

---

## Przykładowe kombinacje parametrów (curl)

### Wszystkie zapisane koncerty, sortowane według daty wydarzenia:

```bash
curl -X GET "http://localhost:3000/api/events?saved=true&category=koncerty&sort=event_date&order=asc" \
  -H "Authorization: Bearer <TOKEN>"
```

### Pierwsza strona wydarzeń dla dzieci (5 na stronę):

```bash
curl -X GET "http://localhost:3000/api/events?age_category=dzieci&page=1&limit=5" \
  -H "Authorization: Bearer <TOKEN>"
```

### Wszystkie niezapisane wydarzenia, alfabetycznie:

```bash
curl -X GET "http://localhost:3000/api/events?saved=false&sort=title&order=asc" \
  -H "Authorization: Bearer <TOKEN>"
```

### Druga strona wszystkich wydarzeń (10 na stronę), najnowsze pierwsze:

```bash
curl -X GET "http://localhost:3000/api/events?page=2&limit=10&sort=created_at&order=desc" \
  -H "Authorization: Bearer <TOKEN>"
```
