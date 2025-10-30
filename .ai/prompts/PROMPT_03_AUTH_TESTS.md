# PROMPT 3: Testy autentykacji - 01-auth.spec.ts

## Kontekst

Mam gotowe fixtures i Page Objects. Teraz tworzę kompleksowy zestaw testów autentykacji.

## ⚠️ WAŻNE: Guidelines

Stosuj zasady z **`.ai/rules/playwright-e2e-testing.mdc`**:

- Use expect assertions with specific matchers
- Implement test hooks for setup and teardown
- Use Page Object Model (TYLKO przez POM, nie bezpośrednie page interactions)

## Setup

- Importuj test i expect z `./fixtures`
- Importuj Page Objects z `./pages`
- Użytkownik testowy jest już utworzony (E2E_USERNAME, E2E_PASSWORD z process.env)

## Zadania - stwórz tests/e2e/01-auth.spec.ts

### Test Suite: "Authentication Flow"

#### 1. Test: "should register new user with valid credentials"

**Kroki:**

- Wygeneruj unikalny email: `test-${Date.now()}@example.com`
- Hasło: `TestPass123!`
- Przejdź na /register używając RegisterPage
- Poczekaj na hydratację formularza
- Zarejestruj użytkownika
- Zweryfikuj przekierowanie na /login z parametrem message=registration_success
- Zweryfikuj że jest widoczny komunikat sukcesu o rejestracji

**Timeout:** 30s

#### 2. Test: "should login with valid credentials"

**Kroki:**

- Użyj istniejącego użytkownika (E2E_USERNAME, E2E_PASSWORD)
- Przejdź na /login używając LoginPage
- Poczekaj na hydratację
- Zaloguj się
- Zweryfikuj przekierowanie na /
- Zweryfikuj że URL to dokładnie "/"

**Timeout:** 30s

#### 3. Test: "should show error for invalid login credentials"

**Kroki:**

- Przejdź na /login
- Poczekaj na hydratację
- Spróbuj zalogować się z błędnymi danymi: wrong@email.com / wrongpassword
- Zweryfikuj że pojawił się komunikat o błędzie (AuthErrorAlert)
- Zweryfikuj że nadal jesteś na /login

**Timeout:** 30s

#### 4. Test: "should logout successfully"

**Kroki:**

- Użyj fixture `authenticatedPage` (już zalogowany)
- Przejdź na /profile używając ProfilePage
- Kliknij przycisk wylogowania
- Zweryfikuj przekierowanie na /login
- Spróbuj przejść na chronioną stronę /events
- Zweryfikuj że nastąpiło przekierowanie z powrotem na /login (middleware)

**Timeout:** 30s

#### 5. Test: "should redirect to login when accessing protected page"

**Kroki:**

- Użyj zwykłego `page` (niezalogowany)
- Spróbuj przejść na /events
- Zweryfikuj automatyczne przekierowanie na /login
- Spróbuj przejść na /profile
- Zweryfikuj automatyczne przekierowanie na /login

**Timeout:** 30s

#### 6. Test: "should persist session across page reloads"

**Kroki:**

- Użyj fixture `authenticatedPage`
- Zweryfikuj że jesteś na /
- Przeładuj stronę: page.reload()
- Poczekaj na załadowanie
- Przejdź na /events
- Zweryfikuj że nie ma przekierowania na /login (sesja persystuje)

**Timeout:** 30s

#### 7. Test: "should navigate between login and register pages"

**Kroki:**

- Przejdź na /login
- Poczekaj na hydratację
- Kliknij link "Zarejestruj się"
- Zweryfikuj przekierowanie na /register
- Poczekaj na hydratację formularza rejestracji
- Kliknij link "Zaloguj się"
- Zweryfikuj powrót na /login

**Timeout:** 30s

#### 8. Test: "should validate registration form fields"

**Kroki:**

- Przejdź na /register
- Poczekaj na hydratację
- Kliknij submit bez wypełniania (puste pola)
- Zweryfikuj błędy walidacji dla email, password, confirmPassword
- Wypełnij email prawidłowo: valid@email.com
- Wypełnij password: short (za krótkie)
- Kliknij submit
- Zweryfikuj błąd walidacji dla password (minimum 8 znaków)
- Wypełnij password: ValidPass123!
- Wypełnij confirmPassword: DifferentPass123! (nie pasuje)
- Kliknij submit
- Zweryfikuj błąd że hasła się nie zgadzają

**Timeout:** 30s

#### 9. Test: "should show password strength indicator"

**Kroki:**

- Przejdź na /register
- Poczekaj na hydratację
- Wypełnij pole password stopniowo i sprawdzaj wskaźnik siły:
  - "weak" → zweryfikuj że wskaźnik pokazuje słabe hasło
  - "WeakPass1" → zweryfikuj zmianę poziomu
  - "StrongP@ss123!" → zweryfikuj wysoką siłę
- Używaj metody `getPasswordStrength()` z RegisterPage

**Timeout:** 30s

## Wymagania techniczne

- Używaj Page Object Methods, nie bezpośrednich interakcji z page
- Wszystkie asserty z expect() z Playwright
- Dla komunikatów błędów używaj: `expect(page.getByText(/błąd|error/i)).toBeVisible()`
- Dla przekierowań: `expect(page).toHaveURL(expectedUrl)`
- Grupuj związane testy w describe
- Każdy test powinien być niezależny (izolacja)
- Używaj meaningful test names opisujących zachowanie

## Przykład struktury:

```typescript
import { test, expect } from "./fixtures";
import { LoginPage, RegisterPage, ProfilePage } from "./pages";

test.describe("Authentication Flow", () => {
  test("should register new user with valid credentials", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    // ... implementacja
  });

  // ... pozostałe testy
});
```

## Dostarcz

Pełny plik `tests/e2e/01-auth.spec.ts` ze wszystkimi 9 testami
