# PROMPT 7: Testy listy wydarzeń - 05-events.spec.ts

## Kontekst

Testy strony z listą zapisanych wydarzeń użytkownika (/events).

## ⚠️ WAŻNE: Guidelines

Stosuj zasady z **`.ai/rules/playwright-e2e-testing.mdc`**:

- Page Object Model - EventsPage i GeneratorPage
- Resilient locators - używaj data-testid dla dynamicznych list
- Parallel execution - możliwe dla read-only testów

## Setup

- Importuj test i expect z `./fixtures`
- Importuj EventsPage, GeneratorPage z `./pages`
- Użyj fixture `authenticatedPage` dla wszystkich testów (strona wymaga logowania)
- **WAŻNE:** Przy tworzeniu testowych eventów używaj krótkiego keyInformation (kilka słów)
- **WAŻNE:** Generowanie AI wymaga 90s timeout (nie 80s!)

## 📚 Lessons from Account Management Tests (04-account-management.spec.ts)

### Modal-based UI Pattern

Jeśli EventsPage będzie używać modali (np. do edycji/usuwania), zastosuj ten pattern:

```typescript
// Page Object - oddziel otwieranie od interakcji
openEditButton = page.getByRole("button", { name: "Edytuj", exact: true });
editModalTitleInput = page.locator("#editTitle");

async openEditModal() {
  await this.openEditButton.click();
  await this.page.waitForTimeout(500); // czekaj na animację modala
}

async editEvent(title: string) {
  await this.editModalTitleInput.fill(title);
  await this.submitButton.click();
}
```

### Hidden Checkboxes (Shadcn/ui)

Jeśli używasz checkboxów z Shadcn/ui (np. do bulk selection):

```typescript
// Checkbox z sr-only class wymaga force click
await this.selectAllCheckbox.click({ force: true });
```

**Dlaczego?** Shadcn/ui używa ukrytego `<input type="checkbox">` z klasą `sr-only` i div/svg intercepts pointer events.

### Button Locators - Exact Text Matching

```typescript
// ✅ DOBRE - exact text matching
getByRole("button", { name: "Usuń", exact: true });
getByRole("button", { name: "Delete", exact: true });

// ❌ ŹLE - regex może nie zadziałać z Playwright
getByRole("button").filter({ hasText: /^Usuń$|^Delete$/ });
```

### Temporary Users for Destructive Tests

Jeśli test usuwa wydarzenia (może wpłynąć na inne testy):

```typescript
// Helper function z 04-account-management.spec.ts
async function createTemporaryUser(page: Page): Promise<{ email: string; password: string }> {
  const email = `temp.user.${Date.now()}@example.com`;
  const password = "TempPass123!";

  const register = new RegisterPage(page);
  await register.goto();
  await register.register(email, password, password);

  // Handle 3 post-registration scenarios
  await page.waitForTimeout(2000);

  if (page.url().includes("/login")) {
    const login = new LoginPage(page);
    await login.login(email, password);
  } else if (!page.url().includes("/profile") && !page.url().includes("/")) {
    await page.goto("/");
  }

  return { email, password };
}
```

### Testing Delete Operations

```typescript
// Jeśli API wymaga Admin key (jak w delete account):
test.skip("should delete event permanently", async ({ page }) => {
  // SKIP: Backend Admin API key not configured in test environment
  // To enable: Add SUPABASE_SERVICE_ROLE_KEY to .env.test
});

// Soft delete (ustawia saved = false) nie wymaga Admin API:
test("should soft delete event", async ({ authenticatedPage: page }) => {
  // ... test implementation
});
```

## Zadania - stwórz tests/e2e/05-events.spec.ts

### Test Suite: "Events List Management"

#### 1. Test: "should display user events list"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Przejdź na /events używając EventsPage
2. Zweryfikuj że strona się załadowała
3. Sprawdź czy są jakieś eventy (może być pusta lista dla nowego użytkownika)
4. Jeśli są eventy:
   - Zweryfikuj że każdy event card zawiera: tytuł, miasto, datę, kategorię
   - Zweryfikuj layout (karty w siatce/liście)
5. Jeśli brak eventów:
   - Zweryfikuj empty state (test 2)

#### 2. Test: "should show empty state when no events"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. **Przygotowanie - upewnij się że user nie ma eventów:**
   - Opcja A: Użyj świeżo zarejestrowanego użytkownika
   - Opcja B: Jeśli są eventy, usuń je wszystkie (jeśli możliwe)
   - Opcja C: Użyj API do wyczyszczenia eventów przed testem

2. Przejdź na /events
3. Zweryfikuj empty state:
   - Komunikat typu "Nie masz jeszcze żadnych wydarzeń"
   - Może być ilustracja/ikona
   - Link/przycisk prowadzący do generatora

4. Kliknij link do generatora
5. Zweryfikuj przekierowanie na / (strona główna z generatorem)

#### 3. Test: "should navigate from events to generator"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Przejdź na /events
2. Znajdź link/przycisk "Utwórz nowe wydarzenie" lub "Generator" lub "Powrót do generatora"
3. Kliknij ten link
4. Zweryfikuj przekierowanie na /
5. Zweryfikuj że formularz generatora jest widoczny

#### 4. Test: "should display event details correctly"

**Timeout:** 120s (zawiera generowanie)
**Fixture:** `authenticatedPage`
**Kroki:**

1. **Przygotowanie - stwórz testowy event:**
   - Przejdź na /
   - Wygeneruj wydarzenie z konkretnymi danymi:
     ```
     title: `Detail Test ${Date.now()}`
     city: "Poznań"
     date: za 10 dni
     category: "koncert"
     ageCategory: "dorośli"
     keyInformation: "Test detali" // KRÓTKIE!
     ```
   - Poczekaj na generowanie (90s timeout)
   - Zapisz event

2. **Weryfikacja na liście:**
   - Przejdź na /events
   - Znajdź event po tytule używając `getEventCardByTitle()`
   - Zweryfikuj że card zawiera:
     - Poprawny tytuł
     - Miasto: "Poznań"
     - Datę (sformatowaną)
     - Kategorię: "koncert"
   - Zweryfikuj że opis jest widoczny lub dostępny (może być skrócony)

#### 5. Test: "should require authentication"

**Timeout:** 30s
**Fixture:** `page` (niezalogowany!)
**Kroki:**

1. Spróbuj przejść na /events bez logowania
2. Zweryfikuj automatyczne przekierowanie na /login
3. Zweryfikuj że middleware zablokował dostęp

#### 6. Test: "should show multiple events"

**Timeout:** 300s (3x generowanie)
**Fixture:** `authenticatedPage`
**Kroki:**

1. **Przygotowanie - stwórz 3 eventy:**
   - Event 1: tytuł "Multi Test A", Warszawa, koncert, keyInformation: "Test A"
   - Event 2: tytuł "Multi Test B", Kraków, wystawa, keyInformation: "Test B"
   - Event 3: tytuł "Multi Test C", Gdańsk, festiwal, keyInformation: "Test C"
   - Każdy: wygeneruj (90s timeout) i zapisz

2. **Weryfikacja listy:**
   - Przejdź na /events
   - Użyj `getEventCount()` - zweryfikuj że jest ≥ 3 eventy
   - Zweryfikuj że wszystkie 3 nowe eventy są widoczne
   - Sprawdź `getEventCards()` - czy zwraca wszystkie karty

3. **Weryfikacja kolejności:**
   - Sprawdź czy eventy są posortowane (najnowsze pierwsze?)
   - LUB sprawdź czy jest domyślne sortowanie

#### 7. Test: "should handle long event titles gracefully"

**Timeout:** 120s
**Fixture:** `authenticatedPage`
**Kroki:**

1. **Stwórz event z bardzo długim tytułem:**
   - Tytuł: `Very Long Event Title That Should Be Truncated Or Wrapped Properly On The Event Card ${Date.now()}`
   - Miasto: "Wrocław"
   - keyInformation: "Długi tytuł" // KRÓTKIE aby AI nie przekroczył 500 znaków
   - Wygeneruj i zapisz (90s timeout)

2. **Weryfikacja wyświetlania:**
   - Przejdź na /events
   - Znajdź event
   - Zweryfikuj że tytuł jest:
     - Skrócony z "..." (truncated)
     - LUB zawinięty do wielu linii (wrapped)
   - Zweryfikuj że layout karty nie jest zepsuty

#### 8. Test: "should show events with special characters"

**Timeout:** 120s
**Fixture:** `authenticatedPage`
**Kroki:**

1. **Stwórz event ze znakami specjalnymi:**
   - Tytuł: `Koncert "Muzyka & Emocje" - 100% 🎵`
   - Miasto: `Łódź`
   - keyInformation: "Znaki 🎵" // KRÓTKIE, może zawierać emoji
   - Wygeneruj i zapisz (90s timeout)

2. **Weryfikacja:**
   - Przejdź na /events
   - Znajdź event
   - Zweryfikuj że znaki specjalne są prawidłowo wyświetlone
   - Zweryfikuj że emoji są widoczne
   - Zweryfikuj brak problemów z encoding

## Testy przyszłościowe (jeśli funkcje są zaimplementowane)

#### 9. Test: "should filter events by category" (SKIP jeśli nie ma filtrowania)

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Upewnij się że masz eventy z różnymi kategoriami
2. Przejdź na /events
3. Użyj filtru kategorii (jeśli istnieje)
4. Wybierz "koncert"
5. Zweryfikuj że pokazane są tylko koncerty
6. Zmień na "wystawa"
7. Zweryfikuj że pokazane są tylko wystawy

#### 10. Test: "should edit event inline" (SKIP jeśli nie ma edycji)

**Timeout:** 60s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Stwórz event
2. Przejdź na /events
3. Znajdź przycisk edycji na karcie eventu
4. Kliknij edycję
5. Zmień tytuł
6. Zapisz zmiany
7. Zweryfikuj że tytuł został zaktualizowany

#### 11. Test: "should delete event" (SKIP jeśli nie ma usuwania)

**Timeout:** 60s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Stwórz event do usunięcia
2. Przejdź na /events
3. Znajdź przycisk usunięcia
4. Kliknij usuń
5. Potwierdź usunięcie (jeśli jest modal)
6. Zweryfikuj że event zniknął z listy

## Pomocnicze funkcje

```typescript
// Tworzenie wielu eventów na raz
async function createMultipleEvents(page: Page, count: number): Promise<string[]> {
  const generator = new GeneratorPage(page);
  const titles: string[] = [];

  for (let i = 0; i < count; i++) {
    const title = `Test Event ${i} - ${Date.now()}`;
    titles.push(title);

    await generator.goto("/");
    await generator.fillEventForm({
      title,
      city: "TestCity",
      date: getFutureDate(i + 1),
      category: "Koncerty", // KAPITALIZACJA! Nie "koncerty"
      ageCategory: "Dorośli", // KAPITALIZACJA! Nie "dorośli"
      keyInformation: `Test ${i}`, // KRÓTKIE!
    });
    await generator.clickGenerate();
    await generator.waitForDescription(90000); // 90s timeout (nie 80s!)
    await generator.clickSave();
    await page.waitForTimeout(2000); // Wait for save
  }

  return titles;
}

// Helper function do generowania przyszłych dat
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}
```

## WAŻNE: Wartości kategorii dla testów

**Kategorie wydarzeń (category):**

Używaj KAPITALIZOWANYCH wartości:

- "Koncerty" (nie "koncerty")
- "Festiwale" (nie "festiwale")
- "Sztuka i wystawy" (nie "wystawa")
- "Teatr i taniec" (nie "teatr")

**Kategorie wiekowe (age_category):**

Używaj pełnych nazw:

- "Dorośli" (nie "dorośli")
- "Nastolatkowie" (nie "młodzież")
- "Dzieci" (nie "dzieci" lowercase)
- "Młodzi dorośli"
- "Wszystkie"

**Dlaczego to ważne:**

- Combobox wymaga dokładnego dopasowania
- Zobacz 02-generator.spec.ts i 03-complete-journey.spec.ts dla przykładów

## Wymagania techniczne

- Wszystkie testy wymagają autentykacji (używaj authenticatedPage)
- Weryfikuj zarówno obecność jak i zawartość eventów
- Testuj edge cases (pusta lista, długie tytuły, znaki specjalne)
- Dla testów tworzących eventy: używaj unikalnych nazw (timestamps)
- Skip testy dla funkcji niezaimplementowanych (oznacz TODO)
- **KRYTYCZNE:** Używaj poprawnych wartości kategorii (kapitalizacja!)

## Priorytetyzacja

**Must have (zaimplementuj teraz):**

- Testy 1-8 (wyświetlanie, empty state, authentication, basic functionality)

**Nice to have (jeśli są funkcje):**

- Testy 9-11 (filtrowanie, edycja, usuwanie)
- Oznacz jako test.skip() lub dodaj TODO jeśli funkcje nie istnieją

## Dostarcz

Pełny plik `tests/e2e/05-events.spec.ts` z testami 1-8 (ewentualnie 9-11 jako skipped)
