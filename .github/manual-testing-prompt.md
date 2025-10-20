# Prompt do Automatycznego Testowania API

Użyj tego promptu dla każdego planu testowego. Zastąp `<manual_test_plan>` odpowiednim plikiem.

---

## PROMPT DO UŻYCIA:

```
Jesteś testerem API dla projektu CulturAllyAI. Twoim zadaniem jest wykonanie testów manualnych z pliku:

<manual_test_plan>
#file:docs/manual-tests/[NAZWA_PLIKU].md
</manual_test_plan>

## Informacje o środowisku testowym:

### Endpointy:
- **Aplikacja**: http://localhost:3000
- **Supabase Auth API**: http://127.0.0.1:54321
- **Supabase API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.TIRWY0tqcwughf1mRzKTmoPFz2XidJIgMvCGvKnWCY0`

### Użytkownicy testowi:
1. **User 1**:
   - Email: `test.user@gmail.com`
   - Password: `awxc56GH3Jje4zMY`
   - User ID: `09dfdd8b-bc3a-4c5f-b885-746559b12ead`

2. **User 2**:
   - Email: `marcin.szwajgier@o2.pl`
   - Password: `awxc56GH3Jje4zMY`
   - User ID: `78c5bec7-5742-49eb-aa86-d68f5b90c4ee`

### Istniejące wydarzenia testowe:
- **Event 1** (User 1): `bc21797e-d8a8-4b99-90bb-e07819952bf6` - Koncert Chopina (koncerty, dorosli)
- **Event 2** (User 1): `6d550b8a-d233-4604-b102-5c065d98add5` - Spektakl Hamlet (teatr_i_taniec, nastolatkowie)
- **Event 3** (User 1): `7bd50ad3-3c19-4c9b-a45d-7fbdb1a4f82e` - Koncert Rockowy (koncerty, mlodzi_dorosli)
- **Event 4** (User 2): `8afb772b-79a7-4807-bfeb-5a1b15ca33bd` - Festiwal Muzyczny (festiwale, wszystkie)

## Instrukcje wykonania testów:

### Wymagania:
1. **NIE używaj `curl` ani `curl.exe`** - PowerShell ma alias który powoduje problemy
2. **Używaj `Invoke-RestMethod` lub `Invoke-WebRequest`** do testowania API
3. Dla każdego testu zwracaj:
   - ✅ PASS / ❌ FAIL
   - Kod statusu HTTP
   - Kluczowe informacje z odpowiedzi (skrócone, nie cały JSON)
   - Opis problemu jeśli test nie przeszedł

### Przykłady składni PowerShell:

#### Pobierz token użytkownika:
```powershell
$body = @{email='test.user@gmail.com'; password='awxc56GH3Jje4zMY'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://127.0.0.1:54321/auth/v1/token?grant_type=password" `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' `
    -Headers @{apikey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.TIRWY0tqcwughf1mRzKTmoPFz2XidJIgMvCGvKnWCY0'}
$token = $response.access_token
```

#### GET request z tokenem:
```powershell
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/events" `
    -Method GET `
    -Headers @{Authorization="Bearer $token"}
```

#### POST request z body i tokenem:
```powershell
$body = @{
    title='Test Event'
    city='Warszawa'
    event_date='2025-12-25T19:00:00Z'
    category='koncerty'
    age_category='dorosli'
    key_information='Test info'
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3000/api/events" `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' `
    -Headers @{Authorization="Bearer $token"}
```

#### PATCH request:
```powershell
$body = @{saved=$true} | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/events/$eventId" `
    -Method PATCH `
    -Body $body `
    -ContentType 'application/json' `
    -Headers @{Authorization="Bearer $token"}
```

#### DELETE request:
```powershell
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/events/$eventId" `
    -Method DELETE `
    -Headers @{Authorization="Bearer $token"}
```

#### Obsługa błędów (sprawdzanie kodów HTTP):
```powershell
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/events/invalid-id" `
        -Method GET `
        -Headers @{Authorization="Bearer $token"}
    Write-Host "❌ FAIL: Powinno zwrócić błąd"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if($statusCode -eq 400) {
        Write-Host "✅ PASS: Zwrócono 400 Bad Request"
    } else {
        Write-Host "❌ FAIL: Oczekiwano 400, otrzymano $statusCode"
    }
}
```

#### Sprawdzanie nagłówków:
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/categories/age" -Method GET
$cacheControl = $response.Headers['Cache-Control']
Write-Host "Cache-Control: $cacheControl"
```

## Proces testowania:

1. **Przygotowanie**:
   - Zaloguj użytkowników i zapisz tokeny do zmiennych `$token1` i `$token2`
   - Użyj istniejących ID wydarzeń podanych powyżej
   - Jeśli potrzebujesz utworzyć nowe wydarzenia, użyj POST /api/events

2. **Wykonanie testów**:
   - Wykonuj testy w kolejności z planu testowego
   - Dla każdego testu wyświetl numer, nazwę i wynik
   - Loguj kluczowe informacje (nie całe JSON'y)

3. **Format raportu**:
```
TEST 1: [Nazwa testu]
Status: ✅ PASS / ❌ FAIL
HTTP: [kod statusu]
Szczegóły: [kluczowe informacje]

TEST 2: [Nazwa testu]
...
```

4. **Podsumowanie**:
Na końcu wyświetl:
- Liczbę testów: X
- Zaliczone: Y (✅)
- Niezaliczone: Z (❌)
- Wskaźnik sukcesu: Y/X * 100%

## Uwagi specjalne:

### Dla POST /api/events:
- Możesz tworzyć wydarzenia jako zalogowany użytkownik (z tokenem) lub jako gość (bez tokenu)
- Zapisz zwrócone ID wydarzeń do późniejszego użycia w testach GET/PATCH/DELETE

### Dla GET /api/events:
- Pamiętaj o testowaniu filtrów: `?saved=true`, `?category=koncerty`, `?age_category=dzieci`
- Testuj paginację: `?page=1&limit=2`
- Testuj sortowanie: `?sort=title&order=asc`

### Dla PATCH /api/events/:id:
- Możesz aktualizować: `saved`, `feedback`, `edited_description`
- Sprawdź czy `updated_at` się zmienia

### Dla DELETE /api/events/:id:
- To jest SOFT DELETE - tylko ustawia `saved=false`
- Sprawdź czy wydarzenie nadal istnieje (GET powinien działać)
- Sprawdź czy `saved` jest ustawione na `false`

## Rozpocznij testowanie:

Wykonaj wszystkie testy z pliku <manual_test_plan> i wygeneruj szczegółowy raport.
```

---

## Jak używać tego promptu:

### Przykład 1: Testowanie GET /api/categories/age
```
[Wklej powyższy prompt]

Zastąp:
<manual_test_plan>
#file:docs/manual-tests/get-age-categories-manual-test-plan.md
</manual_test_plan>
```

### Przykład 2: Testowanie GET /api/events
```
[Wklej powyższy prompt]

Zastąp:
<manual_test_plan>
#file:docs/manual-tests/get-user-events-manual-test-plan.md
</manual_test_plan>
```

### Przykład 3: Testowanie DELETE /api/events/:id
```
[Wklej powyższy prompt]

Zastąp:
<manual_test_plan>
#file:docs/manual-tests/soft-delete-event-id-manual-test-plan.md
</manual_test_plan>
```

---

## Lista plików testowych do przetestowania:

- [ ] `get-age-categories-manual-test-plan.md`
- [ ] `get-event-categories-manual-test-plan.md`
- [ ] `get-event-by-id-manual-test-plan.md`
- [ ] `get-user-events-manual-test-plan.md`
- [ ] `soft-delete-event-id-manual-test-plan.md`
- [ ] `generate-event-manual-test-plan.md` (już wykonany przez Ciebie)
- [ ] `edit-event-id-manual-test-plan.md` (już wykonany przez Ciebie)

---

## Notatki:

- Aplikacja musi być uruchomiona: `npm run dev`
- Supabase musi działać: `supabase start`
- W razie potrzeby odśwież tokeny (wygasają po 1 godzinie)
- Możesz utworzyć dodatkowe wydarzenia testowe używając POST /api/events
