# PROMPT 5: Testy pełnego user journey - 03-complete-journey.spec.ts

## Kontekst

Testy end-to-end flow symulujące rzeczywiste scenariusze użytkownika - od rejestracji przez generowanie do zarządzania eventami.

## ⚠️ WAŻNE: Guidelines

Stosuj zasady z **`.ai/rules/playwright-e2e-testing.mdc`**:

- Browser contexts dla izolacji testów
- Test hooks dla setup/teardown długich operacji
- Trace viewer - włączony automatycznie przy failures
- Page Object Model - TYLKO przez Page Objects

## Setup

- Importuj test i expect z `./fixtures`
- Importuj wszystkie Page Objects
- Testy te są długie - ustawiaj odpowiednie timeouty
- **WAŻNE:** AI generowanie może trwać 10-30s - używaj 90s timeout dla testów z generowaniem
- **WAŻNE:** Trzymaj keyInformation krótkie (kilka słów) aby AI nie przekraczał 500 znaków

## Zadania - stwórz tests/e2e/03-complete-journey.spec.ts

### Test Suite: "Complete User Journey"

#### 1. Test: "should complete full registration to event save journey"

**Timeout:** 180s (3 minuty - rejestracja + generowanie + zapis)
**Fixture:** `page` (niezalogowany)
**Kroki:**

1. **Rejestracja:**
   - Wygeneruj unikalny email: `journey-${Date.now()}@test.com`
   - Hasło: `JourneyTest123!`
   - Przejdź na /register używając RegisterPage
   - Zarejestruj użytkownika
   - Zweryfikuj przekierowanie na /login z success message

2. **Logowanie:**
   - Na stronie /login zaloguj się tym samym użytkownikiem
   - Zweryfikuj przekierowanie na /

3. **Generowanie wydarzenia:**
   - Wypełnij formularz:
     ```
     title: `Journey Event ${Date.now()}`
     city: "Gdańsk"
     date: za 5 dni
     category: "festiwal"
     ageCategory: "młodzież"
     keyInformation: "Festiwal muzyki" // KRÓTKIE aby nie przekroczyć 500 znaków!
     ```
   - Kliknij "Generuj opis"
   - Poczekaj na opis (90s timeout)
   - Zweryfikuj że opis został wygenerowany

4. **Ocena opisu:**
   - Oceń pozytywnie (thumbs up)
   - Zweryfikuj zaznaczenie (aria-pressed="true")
   - **UWAGA:** Przyciski blokują się po ocenie (jedna ocena na event)

5. **Zapis wydarzenia:**
   - Kliknij "Zapisz"
   - Poczekaj na komunikat sukcesu lub nawigację

6. **Weryfikacja zapisu:**
   - Przejdź na /events
   - Zweryfikuj że event jest na liście
   - Znajdź event po tytule
   - Zweryfikuj szczegóły (miasto, kategoria)

7. **Wylogowanie:**
   - Przejdź na /profile
   - Wyloguj się
   - Zweryfikuj przekierowanie na /login

**Asserty końcowe:**

- Cały flow przebiegł bez błędów
- Event jest persystentny (zapisany w bazie)

#### 2. Test: "should complete guest user journey"

**Timeout:** 120s
**Fixture:** `page` (niezalogowany)
**Kroki:**

1. **Wejście na stronę:**
   - Przejdź na /
   - Zweryfikuj że strona się załadowała

2. **Generowanie jako gość:**
   - Wypełnij formularz z prostymi danymi
   - **WAŻNE:** keyInformation max kilka słów (aby nie przekroczyć 500 znaków)
   - Wygeneruj opis
   - Poczekaj na opis (90s timeout)
   - Zweryfikuj że opis jest dostępny

3. **Próba oceny jako gość:**
   - **UWAGA:** Goście NIE MOGĄ oceniać eventów (funkcja tylko dla zalogowanych)
   - Zweryfikuj że przyciski oceny są disabled lub niewidoczne dla gości
   - Pomiń ten krok lub sprawdź komunikat o konieczności logowania

4. **Próba zapisu:**
   - Kliknij "Zapisz"
   - Zweryfikuj że pojawia się komunikat o konieczności logowania
   - LUB zweryfikuj że nie ma możliwości zapisu (button disabled)

5. **Nawigacja do rejestracji:**
   - Kliknij link do rejestracji (jeśli jest w komunikacie)
   - LUB przejdź manualnie na /register
   - Zweryfikuj że jesteś na stronie rejestracji

**Asserty końcowe:**

- Gość może generować opisy
- Gość nie może zapisywać eventów
- System kieruje do rejestracji

#### 3. Test: "should create multiple events in one session"

**Timeout:** 300s (5 minut - 3 generowania)
**Fixture:** `authenticatedPage`
**Kroki:**

1. **Przygotowanie:**
   - Przejdź na /
   - Zlicz obecne eventy (opcjonalnie idź na /events)

2. **Event 1 - Koncert:**
   - Wypełnij: tytuł "Koncert 1", miasto "Warszawa", kategoria "koncert", keyInformation: "Krótki test"
   - Wygeneruj opis (90s timeout)
   - Oceń pozytywnie
   - Zapisz

3. **Event 2 - Wystawa:**
   - Zmień dane: tytuł "Wystawa 2", miasto "Kraków", kategoria "wystawa", keyInformation: "Test 2"
   - Wygeneruj nowy opis (90s timeout)
   - Zapisz (bez oceny)

4. **Event 3 - Warsztat:**
   - Zmień dane: tytuł "Warsztat 3", miasto "Wrocław", kategoria "warsztat", keyInformation: "Test 3"
   - Wygeneruj opis (90s timeout)
   - Oceń negatywnie
   - Zapisz

5. **Weryfikacja:**
   - Przejdź na /events
   - Zweryfikuj że wszystkie 3 eventy są na liście
   - Zweryfikuj prawidłowe tytuły i miasta
   - Zweryfikuj chronologię (najnowsze pierwsze?)

**Asserty końcowe:**

- Użytkownik może tworzyć wiele eventów
- Każdy event jest niezależny
- Wszystkie są prawidłowo zapisane

#### 4. Test: "should handle navigation between pages during journey"

**Timeout:** 120s
**Fixture:** `authenticatedPage`
**Kroki:**

1. **Start na generator:**
   - Przejdź na /
   - Rozpocznij wypełnianie formularza (częściowo)

2. **Nawigacja do events:**
   - Przejdź na /events
   - Zweryfikuj załadowanie listy

3. **Powrót do generator:**
   - Wróć na / (używając linku lub page.goto)
   - **UWAGA:** Dane w formularzu mogą się NIE zachować (brak state persistence)
   - Wypełnij formularz od nowa

4. **Generowanie:**
   - Wygeneruj opis
   - Poczekaj (90s timeout)

5. **Nawigacja do profile:**
   - Przejdź na /profile (bez zapisywania)
   - Zweryfikuj załadowanie profilu

6. **Powrót i zapis:**
   - Wróć na /
   - Sprawdź czy opis jest nadal widoczny
   - Jeśli tak - zapisz event
   - Jeśli nie - wygeneruj ponownie i zapisz

7. **Weryfikacja:**
   - Przejdź na /events
   - Zweryfikuj że event został zapisany

**Asserty końcowe:**

- Nawigacja nie powoduje błędów
- System prawidłowo obsługuje przejścia między stronami
- Dane (wygenerowany opis) mogą lub nie persystować

#### 5. Test: "should recover from errors during journey"

**Timeout:** 150s
**Fixture:** `page`
**Kroki:**

1. **Błąd logowania:**
   - Przejdź na /login
   - Spróbuj zalogować się ze złymi danymi
   - Zweryfikuj błąd
   - Zaloguj się z poprawnymi danymi (E2E_USERNAME)
   - Zweryfikuj sukces

2. **Błąd walidacji formularza:**
   - Przejdź na /
   - Spróbuj wygenerować bez wypełnienia (błąd walidacji)
   - Zweryfikuj błędy
   - Wypełnij poprawnie (krótkie keyInformation!)
   - Wygeneruj (90s timeout)
   - Zweryfikuj sukces

3. **Zapis wydarzenia:**
   - Zapisz wygenerowane wydarzenie
   - Zweryfikuj sukces

**Asserty końcowe:**

- System obsługuje błędy gracefully
- Użytkownik może kontynuować po błędzie
- Dane nie są tracone przy błędach walidacji

## Pomocnicze funkcje

```typescript
// Generowanie unikalnych danych
function generateUniqueEventData(prefix: string = "Event") {
  const timestamp = Date.now();
  return {
    title: `${prefix} ${timestamp}`,
    city: ["Warszawa", "Kraków", "Gdańsk", "Wrocław"][Math.floor(Math.random() * 4)],
    date: getFutureDate(Math.floor(Math.random() * 30) + 1),
    category: "koncert", // lub pobierz z API
    ageCategory: "dorośli",
    keyInformation: "Krótki test", // WAŻNE: krótkie aby AI nie przekraczał 500 znaków
  };
}

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}
```

## Wymagania techniczne

- Journey testy są długie - zawsze ustawiaj explicit timeout
- Każdy test powinien być możliwie niezależny (własne dane)
- Dokumentuj każdy krok komentarzami
- Obsługuj async operations z odpowiednimi wait
- Veryfikuj stan po każdym kroku krytycznym

## Best Practices

- Używaj unikalnych danych (timestamps) dla uniknięcia kolizji
- Grupuj asserty logicznie (po akcji)
- Dodawaj console.log dla debugowania długich testów (opcjonalnie)
- Rób screenshots przy błędach (Playwright robi to auto)
- **KRYTYCZNE:** Trzymaj keyInformation krótkie (max kilka słów) aby AI nie generował >500 znaków
- Używaj 90s timeout dla testów z generowaniem AI (nie 80s)
- Pamiętaj że rating jest jednorazowy - przyciski blokują się po pierwszej ocenie

## Dostarcz

Pełny plik `tests/e2e/03-complete-journey.spec.ts` z wszystkimi 5 testami journey
