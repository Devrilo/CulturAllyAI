# PROMPT 4: Testy generatora AI - 02-generator.spec.ts

## Kontekst

Główna funkcjonalność aplikacji - generowanie opisów wydarzeń kulturalnych przy użyciu AI (OpenRouter API).

## ⚠️ WAŻNE: Guidelines

Stosuj zasady z **`.ai/rules/playwright-e2e-testing.mdc`**:

- Page Object Model - używaj metod z GeneratorPage
- Resilient locators - semantic selectors
- Parallel execution - gdzie możliwe (ale uważaj na rate limiting API)

## KRYTYCZNE informacje

### API i Timeouty

- Generowanie opisu zajmuje 10-30 sekund (wywołanie do OpenRouter)
- Timeout dla testów z generowaniem: **90 sekund**
- API endpoint: POST /api/events/generate-description
- Po zapisaniu: POST /api/events (tworzy event w bazie)
- Po ocenie: POST /api/events/[id]/rate

### Dane kategorii (sprawdź w API lub bazie)

- Kategorie wydarzeń: koncert, spektakl, wystawa, film, warsztat, festiwal, etc.
- Kategorie wiekowe: dzieci, młodzież, dorośli, seniorzy, rodzinne, etc.

## Setup

- Importuj test i expect z `./fixtures`
- Importuj GeneratorPage, EventsPage z `./pages`

## Zadania - stwórz tests/e2e/02-generator.spec.ts

### Test Suite: "Event Description Generator"

#### 1. Test: "should validate required form fields" (użytkownik niezalogowany)

**Timeout:** 30s
**Kroki:**

- Przejdź na / (GeneratorPage)
- Kliknij "Generuj opis" bez wypełniania formularza
- Zweryfikuj błędy walidacji dla:
  - Tytuł wydarzenia (wymagany)
  - Miasto (wymagane)
  - Data wydarzenia (wymagana)
  - Kategoria (wymagana)
  - Długość opisu (wymagana)
- Sprawdź że NIE ma błędu dla "Dodatkowe informacje" (pole opcjonalne)

#### 2. Test: "should validate date field" (użytkownik niezalogowany)

**Timeout:** 30s
**Kroki:**

- Przejdź na /
- Wypełnij wszystkie wymagane pola poprawnie OPRÓCZ daty
- Ustaw datę w przeszłości (np. 2020-01-01)
- Kliknij "Generuj opis"
- Zweryfikuj błąd walidacji dla daty (musi być w przyszłości lub dziś)

#### 3. Test: "should validate title length" (użytkownik niezalogowany)

**Timeout:** 30s
**Kroki:**

- Przejdź na /
- Wypełnij tytuł bardzo długim tekstem (>200 znaków)
- Wypełnij pozostałe pola poprawnie
- Kliknij "Generuj opis"
- Zweryfikuj błąd walidacji długości tytułu

#### 4. Test: "should generate description for guest user" (użytkownik niezalogowany)

**Timeout:** 90s (WAŻNE!)
**Kroki:**

- Przejdź na /
- Wypełnij formularz używając `fillEventForm()`:
  ```
  title: "Koncert Chopina"
  city: "Warszawa"
  date: jutro (YYYY-MM-DD format)
  category: "koncert" (lub pierwsza dostępna)
  ageCategory: "dorośli" (lub pierwsza dostępna)
  length: "150"
  additionalInfo: "Wieczór muzyki klasycznej w filharmonii"
  ```
- Kliknij "Generuj opis"
- Poczekaj na wygenerowanie opisu (użyj `waitForDescription(80000)`)
- Zweryfikuj że opis się pojawił i ma treść
- Zweryfikuj że długość opisu to około 150 słów (±20%)
- Zweryfikuj że przycisk "Zapisz" jest widoczny ale wyłączony lub pokazuje prompt do logowania

#### 5. Test: "should rate generated description" (użytkownik niezalogowany)

**Timeout:** 90s
**Kroki:**

- Przejdź na /
- Wygeneruj opis (jak w teście 4)
- Poczekaj na opis
- Kliknij thumbs up (pozytywna ocena)
- Zweryfikuj że przycisk jest zaznaczony/aktywny
- Kliknij thumbs down (negatywna ocena)
- Zweryfikuj że thumbs down jest zaznaczony, a thumbs up odznaczony

#### 6. Test: "should save event for authenticated user"

**Timeout:** 90s
**Fixture:** `authenticatedPage`
**Kroki:**

- Przejdź na /
- Wypełnij formularz z unikalnymi danymi:
  ```
  title: `E2E Test Event ${Date.now()}`
  city: "Kraków"
  date: za 7 dni
  category: "wystawa"
  ageCategory: "rodzinne"
  length: "100"
  ```
- Kliknij "Generuj opis"
- Poczekaj na opis
- Kliknij "Zapisz"
- Poczekaj na zapisanie (komunikat sukcesu lub przekierowanie)
- Przejdź na /events (EventsPage)
- Zweryfikuj że zapisane wydarzenie jest na liście
- Znajdź event po tytule używając `getEventCardByTitle()`

#### 7. Test: "should prompt authentication when guest tries to save"

**Timeout:** 90s
**Kroki:**

- Przejdź na / (niezalogowany)
- Wygeneruj opis (szybkie wypełnienie)
- Poczekaj na opis
- Kliknij "Zapisz"
- Zweryfikuj że pojawia się komunikat/prompt o konieczności logowania
- LUB zweryfikuj przekierowanie na /login
- LUB zweryfikuj że przycisk jest disabled z tooltipem

#### 8. Test: "should handle API timeout gracefully"

**Timeout:** 95s
**UWAGA:** Ten test może być trudny do zrealizowania - API może nie timeout'ować
**Alternatywa:** Mock network request z opóźnieniem
**Kroki:**

- Przejdź na /
- Wypełnij formularz
- Kliknij "Generuj opis"
- Jeśli po 60 sekundach brak odpowiedzi:
  - Zweryfikuj komunikat o timeout lub błędzie
  - Zweryfikuj że formularz jest nadal dostępny
  - Zweryfikuj że można spróbować ponownie

#### 9. Test: "should preserve form data after generation"

**Timeout:** 90s
**Kroki:**

- Przejdź na /
- Wypełnij formularz z konkretnymi wartościami
- Kliknij "Generuj opis"
- Poczekaj na opis
- Zweryfikuj że dane w formularzu się NIE wyczyściły
- Zweryfikuj że można edytować pola i wygenerować nowy opis

#### 10. Test: "should allow generating multiple descriptions"

**Timeout:** 180s (dwa generowania!)
**Fixture:** `authenticatedPage`
**Kroki:**

- Przejdź na /
- Wygeneruj pierwszy opis dla "Event A"
- Poczekaj na opis
- Zapisz event A
- Zmień tytuł na "Event B"
- Kliknij "Generuj opis" ponownie
- Poczekaj na nowy opis
- Zweryfikuj że nowy opis jest różny od poprzedniego
- Zapisz event B
- Przejdź na /events
- Zweryfikuj że oba eventy są na liście

## Pomocnicze funkcje

### Generowanie daty w przyszłości:

```typescript
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}
```

### Liczenie słów w opisie:

```typescript
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}
```

## Wymagania techniczne

- Dla testów z generowaniem AI: ustawiaj timeout explicitly w teście
- Używaj retry logic jeśli API czasem zawodzi (Playwright robi to automatycznie)
- Weryfikuj komunikaty błędów zawierają sensowny tekst
- Sprawdzaj zarówno sukces jak i failure cases
- Dokumentuj długie oczekiwania komentarzami

## Przykład timeoutu:

```typescript
test("should generate description", async ({ page }) => {
  const generator = new GeneratorPage(page);
  await generator.goto();
  await generator.fillEventForm({...});
  await generator.clickGenerate();
  await generator.waitForDescription(80000); // 80s timeout
  // ... asserty
}, { timeout: 90000 }); // 90s test timeout
```

## Dostarcz

Pełny plik `tests/e2e/02-generator.spec.ts` ze wszystkimi testami
