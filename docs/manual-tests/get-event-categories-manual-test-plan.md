# Testy Manualne: GET /api/categories/events

## Przygotowanie środowiska testowego

### Wymagania wstępne

- Aplikacja uruchomiona na `http://localhost:4321`
- Zainstalowany Postman lub curl

### Informacje o endpoincie

⚠️ **UWAGA:** Ten endpoint **nie wymaga autoryzacji**! Jest publicznie dostępny.

**Metoda:** `GET`

**URL:** `/api/categories/events`

**Opis:** Zwraca listę dostępnych kategorii wydarzeń kulturalnych z wartościami enum i polskimi etykietami.

---

## PRZYPADEK TESTOWY 1: Pobranie listy kategorii wydarzeń (Sukces - 200)

### Opis

Pobranie pełnej listy dostępnych kategorii wydarzeń kulturalnych z wartościami enum i etykietami w języku polskim.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**

```
http://localhost:4321/api/categories/events
```

**Headers:** brak (endpoint publiczny)

**Query Parameters:** brak

**Body:** brak (GET nie używa body)

#### 3. Wyślij request (kliknij "Send")

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwana struktura odpowiedzi:**

```json
{
  "categories": [
    {
      "value": "koncerty",
      "label": "Koncerty"
    },
    {
      "value": "imprezy",
      "label": "Imprezy"
    },
    {
      "value": "teatr_i_taniec",
      "label": "Teatr i taniec"
    },
    {
      "value": "sztuka_i_wystawy",
      "label": "Sztuka i wystawy"
    },
    {
      "value": "literatura",
      "label": "Literatura"
    },
    {
      "value": "kino",
      "label": "Kino"
    },
    {
      "value": "festiwale",
      "label": "Festiwale"
    },
    {
      "value": "inne",
      "label": "Inne"
    }
  ]
}
```

**Weryfikacja:**

- Status HTTP = 200
- Odpowiedź zawiera dokładnie 8 kategorii wydarzeń
- Każda kategoria ma pola `value` i `label`
- Wszystkie wartości `value` zgadzają się z enumem `event_category` w bazie danych
- Wszystkie `label` są po polsku
- Header `Cache-Control: public, max-age=3600` jest ustawiony
- Header `Content-Type: application/json` jest ustawiony

---

## PRZYPADEK TESTOWY 2: Weryfikacja nagłówków cache (Sukces - 200)

### Opis

Sprawdzenie czy endpoint zwraca odpowiednie nagłówki cache dla optymalizacji.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**

```
http://localhost:4321/api/categories/events
```

#### 3. Wyślij request

#### 4. Weryfikacja nagłówków w sekcji "Headers" (Response)

**Oczekiwane nagłówki:**

| Nagłówek        | Wartość                |
| --------------- | ---------------------- |
| `Content-Type`  | `application/json`     |
| `Cache-Control` | `public, max-age=3600` |

**Weryfikacja:**

- Header `Cache-Control` jest obecny
- Wartość `Cache-Control` to `public, max-age=3600` (cache przez 1 godzinę)
- Dane można cache'ować publicznie (CDN, przeglądarki)

---

## PRZYPADEK TESTOWY 3: Wielokrotne żądania (Sukces - 200)

### Opis

Sprawdzenie czy endpoint zwraca konsystentne dane przy wielokrotnych zapytaniach.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**

```
http://localhost:4321/api/categories/events
```

#### 3. Wyślij request 3-5 razy z rzędu (kliknij "Send" wielokrotnie)

#### 4. Weryfikacja odpowiedzi

**Oczekiwany rezultat:**

- Wszystkie odpowiedzi mają status 200
- Wszystkie odpowiedzi zawierają identyczne dane
- Czas odpowiedzi jest konsekwentnie szybki (<10ms)
- Brak błędów w logach serwera

---

## PRZYPADEK TESTOWY 4: Żądanie z parametrami query (Sukces - 200)

### Opis

Sprawdzenie czy endpoint ignoruje parametry query (nie są wymagane ani używane).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**

```
http://localhost:4321/api/categories/events?random=param&test=123
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwany rezultat:**

- Odpowiedź jest identyczna jak w PRZYPADKU TESTOWYM 1
- Parametry query są ignorowane
- Zwracana jest pełna lista 8 kategorii

---

## PRZYPADEK TESTOWY 5: Metoda POST niedozwolona (Błąd - 404/405)

### Opis

Próba wywołania endpointu metodą POST (niedozwoloną).

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `POST`

**URL:**

```
http://localhost:4321/api/categories/events
```

**Headers:**

| Key            | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

**Body (raw, JSON):**

```json
{}
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `404 Not Found` lub `405 Method Not Allowed`

**Weryfikacja:**

- Endpoint nie akceptuje metody POST
- Zwracany jest odpowiedni kod błędu (404 lub 405)

---

## PRZYPADEK TESTOWY 6: Curl - Pobranie kategorii (Sukces - 200)

### Opis

Test tego samego endpointu używając curl w PowerShell.

### Kroki wykonania

#### 1. Otwórz terminal (PowerShell)

#### 2. Wykonaj polecenie

```powershell
curl http://localhost:4321/api/categories/events
```

#### 3. Weryfikacja odpowiedzi

**Oczekiwany output:**

```json
{
  "categories": [
    {
      "value": "koncerty",
      "label": "Koncerty"
    },
    ...
  ]
}
```

**Weryfikacja:**

- Status 200
- Pełna lista 8 kategorii w JSON

---

## PRZYPADEK TESTOWY 7: Curl - Weryfikacja nagłówków (Sukces - 200)

### Opis

Sprawdzenie nagłówków odpowiedzi używając curl z opcją verbose.

### Kroki wykonania

#### 1. Otwórz terminal (PowerShell)

#### 2. Wykonaj polecenie

```powershell
curl -i http://localhost:4321/api/categories/events
```

**Uwaga:** Opcja `-i` (include headers) pokazuje nagłówki HTTP w odpowiedzi.

#### 3. Weryfikacja odpowiedzi

**Oczekiwany output (nagłówki):**

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=3600
...
```

**Weryfikacja:**

- Nagłówek `Cache-Control: public, max-age=3600` jest obecny
- Nagłówek `Content-Type: application/json` jest obecny

---

## Podsumowanie testów

### Matryca przypadków testowych

| Test | Typ          | Scenariusz                  | Oczekiwany status | Oczekiwany rezultat                 |
| ---- | ------------ | --------------------------- | ----------------- | ----------------------------------- |
| 1    | ✅ Pozytywny | Pobranie listy kategorii    | 200               | Lista 8 kategorii wydarzeń          |
| 2    | ✅ Pozytywny | Weryfikacja nagłówków cache | 200               | Cache-Control: public, max-age=3600 |
| 3    | ✅ Pozytywny | Wielokrotne żądania         | 200               | Konsystentne dane                   |
| 4    | ✅ Pozytywny | Żądanie z parametrami query | 200               | Parametry ignorowane                |
| 5    | ❌ Negatywny | Metoda POST                 | 404/405           | Metoda niedozwolona                 |
| 6    | ✅ Pozytywny | Test z curl                 | 200               | Lista kategorii                     |
| 7    | ✅ Pozytywny | Curl z nagłówkami           | 200               | Nagłówki cache obecne               |

### Legenda statusów HTTP

- **200 OK** - Sukces, zwrócono listę kategorii wydarzeń
- **404 Not Found** - Endpoint nie istnieje lub metoda HTTP niedozwolona
- **405 Method Not Allowed** - Metoda HTTP niedozwolona (jeśli używany framework to wspiera)
- **500 Internal Server Error** - Nieoczekiwany błąd serwera (nie powinien wystąpić)

### Kategorie wydarzeń (enum `event_category`)

Endpoint zwraca 8 kategorii wydarzeń:

| Value              | Label            |
| ------------------ | ---------------- |
| `koncerty`         | Koncerty         |
| `imprezy`          | Imprezy          |
| `teatr_i_taniec`   | Teatr i taniec   |
| `sztuka_i_wystawy` | Sztuka i wystawy |
| `literatura`       | Literatura       |
| `kino`             | Kino             |
| `festiwale`        | Festiwale        |
| `inne`             | Inne             |

### Uwagi końcowe

1. **Endpoint publiczny** - NIE wymaga autoryzacji (brak nagłówka `Authorization`).

2. **Statyczne dane** - Endpoint nie korzysta z bazy danych. Dane są zwracane z pamięci (bardzo szybkie).

3. **Cache'owanie** - Nagłówek `Cache-Control: public, max-age=3600` pozwala cache'ować odpowiedź przez 1 godzinę w CDN i przeglądarkach.

4. **Brak parametrów** - Endpoint nie przyjmuje żadnych parametrów (path, query, body).

5. **Brak walidacji** - Brak parametrów wejściowych = brak walidacji.

6. **Wydajność** - Typowy czas odpowiedzi < 10ms (brak dostępu do bazy danych).

7. **Brak logowania** - Akcja nie jest logowana (endpoint publiczny, tylko odczyt statycznych danych).

8. **Rozmiar odpowiedzi** - ~300-400 bajtów JSON (bardzo mały, idealny do cache'owania).

9. **Use case** - Użycie w formularzach do wyboru kategorii wydarzenia (dropdown/select).

10. **Kompatybilność** - Wartości `value` dokładnie odpowiadają enumowi `event_category` w bazie danych Supabase.

---

## Dodatkowe scenariusze testowe (opcjonalne)

### Test: Pomiar czasu odpowiedzi

```powershell
Measure-Command { curl http://localhost:4321/api/categories/events | Out-Null }
```

Oczekiwany czas: < 50ms (zazwyczaj < 10ms)

### Test: Sprawdzenie struktury każdej kategorii

Zweryfikuj czy każda z 8 kategorii ma:

- Pole `value` (string, zgodny z enumem)
- Pole `label` (string, polski opis)
- Brak dodatkowych pól

### Test: Porównanie z enumem w bazie danych

1. Otwórz `src/db/database.types.ts`
2. Znajdź enum `event_category`
3. Porównaj wartości z odpowiedzią API
4. Wszystkie wartości powinny się zgadzać
