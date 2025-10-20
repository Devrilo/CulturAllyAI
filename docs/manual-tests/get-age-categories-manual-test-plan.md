# Testy Manualne: GET /api/categories/age

## Przygotowanie środowiska testowego

### Wymagania wstępne
- Aplikacja uruchomiona na `http://localhost:4321`
- Zainstalowany Postman lub curl

### Informacje o endpoincie

⚠️ **UWAGA:** Ten endpoint **nie wymaga autoryzacji**! Jest publicznie dostępny.

**Metoda:** `GET`

**URL:** `/api/categories/age`

**Opis:** Zwraca listę dostępnych kategorii wiekowych z wartościami enum i polskimi etykietami.

---

## PRZYPADEK TESTOWY 1: Pobranie listy kategorii wiekowych (Sukces - 200)

### Opis
Pobranie pełnej listy dostępnych kategorii wiekowych z wartościami enum i etykietami w języku polskim.

### Kroki wykonania

#### 1. Otwórz Postman i utwórz nowy request

#### 2. Skonfiguruj request

**Metoda:** `GET`

**URL:**
```
http://localhost:4321/api/categories/age
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
      "value": "wszystkie",
      "label": "Wszystkie"
    },
    {
      "value": "najmlodsi",
      "label": "Najmłodsi (0-3 lata)"
    },
    {
      "value": "dzieci",
      "label": "Dzieci (4-12 lat)"
    },
    {
      "value": "nastolatkowie",
      "label": "Nastolatkowie (13-17 lat)"
    },
    {
      "value": "mlodzi_dorosli",
      "label": "Młodzi dorośli (18-35 lat)"
    },
    {
      "value": "dorosli",
      "label": "Dorośli (36-64 lata)"
    },
    {
      "value": "osoby_starsze",
      "label": "Osoby starsze (65+ lat)"
    }
  ]
}
```

**Weryfikacja:**
- Status HTTP = 200
- Odpowiedź zawiera dokładnie 7 kategorii wiekowych
- Każda kategoria ma pola `value` i `label`
- Wszystkie wartości `value` zgadzają się z enumem `age_category` w bazie danych
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
http://localhost:4321/api/categories/age
```

#### 3. Wyślij request

#### 4. Weryfikacja nagłówków w sekcji "Headers" (Response)

**Oczekiwane nagłówki:**

| Nagłówek | Wartość |
|----------|---------|
| `Content-Type` | `application/json` |
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
http://localhost:4321/api/categories/age
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
http://localhost:4321/api/categories/age?random=param&test=123
```

#### 3. Wyślij request

#### 4. Weryfikacja odpowiedzi

**Oczekiwany status:** `200 OK`

**Oczekiwany rezultat:**
- Odpowiedź jest identyczna jak w PRZYPADKU TESTOWYM 1
- Parametry query są ignorowane
- Zwracana jest pełna lista 7 kategorii

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
http://localhost:4321/api/categories/age
```

**Headers:**

| Key | Value |
|-----|-------|
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
curl http://localhost:4321/api/categories/age
```

#### 3. Weryfikacja odpowiedzi

**Oczekiwany output:**
```json
{
  "categories": [
    {
      "value": "wszystkie",
      "label": "Wszystkie"
    },
    ...
  ]
}
```

**Weryfikacja:**
- Status 200
- Pełna lista 7 kategorii w JSON

---

## PRZYPADEK TESTOWY 7: Curl - Weryfikacja nagłówków (Sukces - 200)

### Opis
Sprawdzenie nagłówków odpowiedzi używając curl z opcją verbose.

### Kroki wykonania

#### 1. Otwórz terminal (PowerShell)

#### 2. Wykonaj polecenie

```powershell
curl -i http://localhost:4321/api/categories/age
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

| Test | Typ | Scenariusz | Oczekiwany status | Oczekiwany rezultat |
|------|-----|-----------|-------------------|---------------------|
| 1 | ✅ Pozytywny | Pobranie listy kategorii | 200 | Lista 7 kategorii wiekowych |
| 2 | ✅ Pozytywny | Weryfikacja nagłówków cache | 200 | Cache-Control: public, max-age=3600 |
| 3 | ✅ Pozytywny | Wielokrotne żądania | 200 | Konsystentne dane |
| 4 | ✅ Pozytywny | Żądanie z parametrami query | 200 | Parametry ignorowane |
| 5 | ❌ Negatywny | Metoda POST | 404/405 | Metoda niedozwolona |
| 6 | ✅ Pozytywny | Test z curl | 200 | Lista kategorii |
| 7 | ✅ Pozytywny | Curl z nagłówkami | 200 | Nagłówki cache obecne |

### Legenda statusów HTTP

- **200 OK** - Sukces, zwrócono listę kategorii wiekowych
- **404 Not Found** - Endpoint nie istnieje lub metoda HTTP niedozwolona
- **405 Method Not Allowed** - Metoda HTTP niedozwolona (jeśli używany framework to wspiera)
- **500 Internal Server Error** - Nieoczekiwany błąd serwera (nie powinien wystąpić)

### Kategorie wiekowe (enum `age_category`)

Endpoint zwraca 7 kategorii wiekowych:

| Value | Label |
|-------|-------|
| `wszystkie` | Wszystkie |
| `najmlodsi` | Najmłodsi (0-3 lata) |
| `dzieci` | Dzieci (4-12 lat) |
| `nastolatkowie` | Nastolatkowie (13-17 lat) |
| `mlodzi_dorosli` | Młodzi dorośli (18-35 lat) |
| `dorosli` | Dorośli (36-64 lata) |
| `osoby_starsze` | Osoby starsze (65+ lat) |

### Uwagi końcowe

1. **Endpoint publiczny** - NIE wymaga autoryzacji (brak nagłówka `Authorization`).

2. **Statyczne dane** - Endpoint nie korzysta z bazy danych. Dane są zwracane z pamięci (bardzo szybkie).

3. **Cache'owanie** - Nagłówek `Cache-Control: public, max-age=3600` pozwala cache'ować odpowiedź przez 1 godzinę w CDN i przeglądarkach.

4. **Brak parametrów** - Endpoint nie przyjmuje żadnych parametrów (path, query, body).

5. **Brak walidacji** - Brak parametrów wejściowych = brak walidacji.

6. **Wydajność** - Typowy czas odpowiedzi < 10ms (brak dostępu do bazy danych).

7. **Brak logowania** - Akcja nie jest logowana (endpoint publiczny, tylko odczyt statycznych danych).

8. **Rozmiar odpowiedzi** - ~250-350 bajtów JSON (bardzo mały, idealny do cache'owania).

9. **Use case** - Użycie w formularzach do wyboru kategorii wiekowej wydarzenia (dropdown/select).

10. **Kompatybilność** - Wartości `value` dokładnie odpowiadają enumowi `age_category` w bazie danych Supabase.

---

## Dodatkowe scenariusze testowe (opcjonalne)

### Test: Pomiar czasu odpowiedzi

```powershell
Measure-Command { curl http://localhost:4321/api/categories/age | Out-Null }
```

Oczekiwany czas: < 50ms (zazwyczaj < 10ms)

### Test: Sprawdzenie struktury każdej kategorii

Zweryfikuj czy każda z 7 kategorii ma:
- Pole `value` (string, zgodny z enumem)
- Pole `label` (string, polski opis)
- Brak dodatkowych pól

### Test: Porównanie z enumem w bazie danych

1. Otwórz `src/db/database.types.ts`
2. Znajdź enum `age_category`
3. Porównaj wartości z odpowiedzią API
4. Wszystkie wartości powinny się zgadzać
