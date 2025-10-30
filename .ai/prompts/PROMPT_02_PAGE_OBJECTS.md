# PROMPT 2: Page Object Models - implementacja

## Kontekst

Mam już skonfigurowane fixtures i infrastrukturę testową. Teraz tworzę Page Object Models dla wszystkich stron aplikacji.

## ⚠️ WAŻNE: Guidelines

Stosuj zasady z **`.ai/rules/playwright-e2e-testing.mdc`**:

- **Page Object Model pattern** - separacja logiki testów od interakcji z UI
- **Resilient locators** - getByRole, getByLabel, getByText (NIE CSS selectors!)
- **Reusable methods** - każda akcja jako metoda w Page Object

## Wzorzec Page Object Model

### Struktura bazowa

```typescript
import type { Page, Locator } from "@playwright/test";

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForURL(path: string, timeout = 10000) {
    await this.page.waitForURL(path, { timeout });
  }
}
```

## Zadania - stwórz następujące Page Objects:

### 1. tests/e2e/pages/BasePage.ts

- Klasa bazowa dla wszystkich POM
- Metody: goto(path), waitForURL(path, timeout)

### 2. tests/e2e/pages/LoginPage.ts

SPRAWDŹ: `src/components/auth/LoginForm.tsx` i `src/pages/login.astro`

Kluczowe elementy:

- Form ma `aria-label="Formularz logowania"` i `data-hydrated="true"` gdy gotowy
- Email: Label "Email", input type="email", id="email"
- Password: Label "Hasło", input type="password", id="password"
- Submit button: tekst "Zaloguj się"
- Link do rejestracji: "Zarejestruj się"
- Success alert może się pojawić z tekstem "Rejestracja przebiegła pomyślnie"

Zaimplementuj:

- Locatory dla wszystkich elementów (używaj getByLabel, getByRole)
- Metodę `waitForFormHydration()` - czeka na data-hydrated="true"
- Metodę `login(email, password)` - wypełnia i submituje
- Metodę `clickRegisterLink()` - nawigacja do rejestracji
- Metodę `hasSuccessMessage()` - sprawdza czy jest success alert

### 3. tests/e2e/pages/RegisterPage.ts

SPRAWDŹ: `src/components/auth/RegisterForm.tsx` i `src/pages/register.astro`

Kluczowe elementy:

- Form ma `aria-label="Formularz rejestracji"` i `data-hydrated="true"`
- Email: Label "Email", type="email"
- Password: Label "Hasło", type="password", ma wskaźnik siły hasła
- Confirm Password: Label "Powtórz hasło", type="password"
- Submit button: tekst "Utwórz konto"
- Link do logowania: "Zaloguj się"
- Password strength indicator: 5 pasków i tekst "Siła hasła: [poziom]"

Zaimplementuj:

- Locatory dla wszystkich pól
- Metodę `waitForFormHydration()`
- Metodę `register(email, password, confirmPassword)` - wypełnia i submituje
- Metodę `clickLoginLink()`
- Metodę `getPasswordStrength()` - zwraca tekst poziomu siły hasła
- Metodę `hasValidationError(field)` - sprawdza czy pole ma błąd

### 4. tests/e2e/pages/GeneratorPage.ts

SPRAWDŹ: `src/components/generator/GeneratorPage.tsx` i komponenty w `src/components/generator/`

Aplikacja to generator opisów wydarzeń kulturalnych. Główna strona (/) zawiera:

**Formularz EventForm** (lewa strona):

- Title: Label "Tytuł wydarzenia", textarea
- City: Label "Miasto", input text
- Date: Label "Data wydarzenia", input date
- Category: Label "Kategoria", select/combobox
- Age Category: Label "Grupa wiekowa", select/combobox
- Length: Label "Długość opisu", select (opcje: 50, 100, 150, 200, 250, 300 słów)
- Additional Info: Label "Dodatkowe informacje", textarea (opcjonalne)
- Przycisk "Generuj opis" - submituje formularz

**Panel DescriptionPanel** (prawa strona):

- Początkowo empty state z tekstem "Wypełnij formularz" lub podobny
- Po generowaniu pokazuje wygenerowany opis
- Przyciski oceny (thumbs up/down) - RatingButtons
- Przycisk "Zapisz" - SaveButton (wymaga logowania)
- Możliwy komunikat o timeout

Zaimplementuj:

- Locatory dla wszystkich pól formularza (używaj getByLabel)
- Locator dla przycisku "Generuj opis"
- Locator dla panelu z opisem
- Metodę `fillEventForm(data)` - wypełnia wszystkie pola
- Metodę `clickGenerate()` - klika generuj
- Metodę `waitForDescription(timeout)` - czeka na wygenerowany opis (długi timeout!)
- Metodę `getGeneratedDescription()` - zwraca tekst opisu
- Metodę `rateDescription(rating)` - klika thumbs up/down
- Metodę `clickSave()` - zapisuje event
- Metodę `isAuthPromptVisible()` - sprawdza czy jest prompt do logowania
- Metodę `hasValidationError(field)` - sprawdza błędy walidacji

### 5. tests/e2e/pages/EventsPage.ts

SPRAWDŹ: `src/pages/events.astro` i komponenty w `src/components/events/`

Strona /events pokazuje listę zapisanych wydarzeń:

- Tytuł strony lub heading "Moje wydarzenia" lub podobny
- Lista event cards - każdy card pokazuje tytuł, miasto, datę, kategorię
- Empty state gdy brak eventów: tekst "Nie masz jeszcze żadnych wydarzeń" lub podobny
- Link/przycisk powrotu do generatora

Zaimplementuj:

- Locator dla listy wydarzeń
- Locator dla pojedynczego event card (używaj data-testid lub struktury)
- Metodę `getEventCards()` - zwraca wszystkie karty
- Metodę `getEventCardByTitle(title)` - znajduje konkretny event
- Metodę `hasEmptyState()` - sprawdza czy jest komunikat o braku eventów
- Metodę `clickBackToGenerator()` - wraca do generatora
- Metodę `getEventCount()` - zwraca liczbę eventów

### 6. tests/e2e/pages/ProfilePage.ts

SPRAWDŹ: `src/pages/profile.astro` i komponenty w `src/components/settings/`

Strona /profile (ustawienia konta):

- Sekcja zmiany hasła:
  - Current Password: input type="password"
  - New Password: input type="password"
  - Confirm New Password: input type="password"
  - Przycisk "Zmień hasło"
- Sekcja usuwania konta:
  - Przycisk "Usuń konto"
  - Modal potwierdzenia z przyciskami "Anuluj" i "Usuń"
- Przycisk wylogowania: "Wyloguj się"

Zaimplementuj:

- Locatory dla pól zmiany hasła
- Locatory dla przycisku usuwania konta
- Metodę `changePassword(current, newPwd, confirm)` - zmienia hasło
- Metodę `clickDeleteAccount()` - otwiera modal
- Metodę `confirmDeleteAccount()` - potwierdza usunięcie w modalu
- Metodę `cancelDeleteAccount()` - anuluje usunięcie
- Metodę `clickLogout()` - wylogowuje
- Metodę `hasSuccessMessage()` - sprawdza komunikat sukcesu

### 7. tests/e2e/pages/index.ts

Eksportuj wszystkie Page Objects:

```typescript
export { BasePage } from "./BasePage";
export { LoginPage } from "./LoginPage";
export { RegisterPage } from "./RegisterPage";
export { GeneratorPage } from "./GeneratorPage";
export { EventsPage } from "./EventsPage";
export { ProfilePage } from "./ProfilePage";
```

## Wymagania techniczne

- Wszystkie metody async/await
- Używaj semantycznych lokatorów (getByRole, getByLabel, getByText)
- NIE używaj CSS selektorów ani XPath (chyba że absolutnie konieczne)
- Wszystkie teksty w UI są PO POLSKU
- Czekaj na hydratację React komponentów (data-hydrated="true")
- Dokumentuj każdą metodę JSDoc
- TypeScript strict mode

## Dostarcz

Kompletne pliki Page Object dla wszystkich 7 klas w folderze `tests/e2e/pages/`
