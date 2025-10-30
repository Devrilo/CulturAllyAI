# PROMPT 6: Testy zarządzania kontem - 04-account-management.spec.ts

## Kontekst

Testy funkcjonalności zarządzania kontem użytkownika: zmiana hasła, usuwanie konta.

## ⚠️ WAŻNE: Guidelines

Stosuj zasady z **`.ai/rules/playwright-e2e-testing.mdc`**:

- Browser contexts - izolacja dla testów destrukcyjnych (delete account)
- Page Object Model
- Test hooks - cleanup po destructive tests

## Setup

- Importuj test i expect z `./fixtures`
- Importuj ProfilePage, LoginPage, RegisterPage z `./pages`
- Użyj fixture `authenticatedPage` dla większości testów
- **WSKAZÓWKA:** Użyj pomocniczej funkcji `createTemporaryUser()` dla testów destrukcyjnych

## ⚠️ WAŻNE: Rejestracja może mieć różne zachowania

Po pomyślnej rejestracji aplikacja może:

1. **Auto-logować** użytkownika i przekierować na `/`
2. Przekierować na `/login` z komunikatem sukcesu
3. Pozostać na `/register` (rzadko)

**W testach:**

- Sprawdź `page.url()` po rejestracji
- Obsłuż wszystkie 3 przypadki w `createTemporaryUser()`
- Przykład jest w sekcji "Pomocnicze funkcje" poniżej

## Zadania - stwórz tests/e2e/04-account-management.spec.ts

### Test Suite: "Account Management"

#### 1. Test: "should change password successfully"

**Timeout:** 45s
**Fixture:** `authenticatedPage`
**UWAGA:** Ten test modyfikuje hasło użytkownika - użyj dedykowanego użytkownika lub cofnij zmiany
**Kroki:**

1. Przejdź na /profile używając ProfilePage
2. Wypełnij formularz zmiany hasła:
   - Current password: E2E_PASSWORD
   - New password: `NewTestPass123!`
   - Confirm new password: `NewTestPass123!`
3. Kliknij "Zmień hasło"
4. Zweryfikuj komunikat sukcesu
5. **Weryfikacja zmiany:**
   - Wyloguj się (kliknij przycisk logout)
   - Przejdź na /login
   - Spróbuj zalogować się STARYM hasłem
   - Zweryfikuj błąd
   - Zaloguj się NOWYM hasłem
   - Zweryfikuj sukces (przekierowanie na /)

**OPCJONALNIE:** Przywróć stare hasło na końcu testu

#### 2. Test: "should validate password change form"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Przejdź na /profile
2. **Test 1 - puste pola:**
   - Kliknij "Zmień hasło" bez wypełniania
   - Zweryfikuj błędy walidacji

3. **Test 2 - nieprawidłowe obecne hasło:**
   - Current password: `WrongPassword123!`
   - New password: `NewPass123!`
   - Confirm new password: `NewPass123!`
   - Kliknij "Zmień hasło"
   - Zweryfikuj błąd autoryzacji (wrong current password)

4. **Test 3 - hasła się nie zgadzają:**
   - Current password: E2E_PASSWORD (poprawne)
   - New password: `NewPass123!`
   - Confirm new password: `DifferentPass123!`
   - Kliknij "Zmień hasło"
   - Zweryfikuj błąd walidacji (passwords don't match)

5. **Test 4 - za słabe nowe hasło:**
   - Current password: E2E_PASSWORD
   - New password: `weak` (za krótkie/słabe)
   - Confirm new password: `weak`
   - Kliknij "Zmień hasło"
   - Zweryfikuj błąd walidacji (password requirements)

#### 3. Test: "should not allow changing to the same password"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Przejdź na /profile
2. Wypełnij formularz:
   - Current password: E2E_PASSWORD
   - New password: E2E_PASSWORD (to samo!)
   - Confirm new password: E2E_PASSWORD
3. Kliknij "Zmień hasło"
4. Zweryfikuj błąd/ostrzeżenie że nowe hasło musi być inne
   - LUB system może to zaakceptować (zależnie od implementacji)
   - Jeśli brak walidacji - zaznacz w komentarzu

#### 4. Test: "should delete account with confirmation"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**⚠️ UWAGA:** Ten test USUWA UŻYTKOWNIKA! Użyj tymczasowego użytkownika!
**Kroki:**

1. **Przygotowanie - stwórz tymczasowego użytkownika:**
   - Wygeneruj unikalny email: `delete-test-${Date.now()}@test.com`
   - Zarejestruj się
   - Zaloguj się

2. **Usuwanie konta:**
   - Przejdź na /profile
   - Kliknij "Usuń konto"
   - Zweryfikuj że pojawił się modal potwierdzenia
   - Zweryfikuj tekst w modalu (ostrzeżenie o nieodwracalności)
   - Kliknij "Usuń" (potwierdź)

3. **Weryfikacja usunięcia:**
   - Zweryfikuj przekierowanie na /login lub /register
   - Spróbuj zalogować się usuniętym kontem
   - Zweryfikuj błąd (invalid credentials lub user not found)

**Asserty:**

- Konto zostało usunięte z bazy
- Użytkownik został wylogowany
- Nie można zalogować się usuniętym kontem

#### 5. Test: "should cancel account deletion"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Przejdź na /profile
2. Kliknij "Usuń konto"
3. Zweryfikuj modal potwierdzenia
4. Kliknij "Anuluj"
5. Zweryfikuj że modal zniknął
6. Zweryfikuj że nadal jesteś na /profile
7. **Weryfikacja że konto jest OK:**
   - Odśwież stronę
   - Zweryfikuj że jesteś nadal zalogowany
   - Przejdź na /events
   - Zweryfikuj dostęp (konto nie zostało usunięte)

#### 6. Test: "should logout and clear session"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Przejdź na /profile
2. Kliknij "Wyloguj się"
3. Zweryfikuj przekierowanie na /login
4. **Weryfikacja wyczyszczenia sesji:**
   - Spróbuj wejść na /events
   - Zweryfikuj przekierowanie na /login (brak sesji)
   - Spróbuj wejść na /profile
   - Zweryfikuj przekierowanie na /login
5. **Weryfikacja cookies:**
   - Sprawdź że cookies sesji zostały wyczyszczone
   - Użyj: `await context.cookies()` lub podobne

#### 7. Test: "should require authentication for profile access"

**Timeout:** 30s
**Fixture:** `page` (niezalogowany!)
**Kroki:**

1. Spróbuj przejść na /profile bez logowania
2. Zweryfikuj automatyczne przekierowanie na /login
3. Zweryfikuj że nie ma dostępu do ustawień konta

#### 8. Test: "should show account information on profile page"

**Timeout:** 30s
**Fixture:** `authenticatedPage`
**Kroki:**

1. Przejdź na /profile
2. Zweryfikuj wyświetlenie adresu email użytkownika
   - Użyj E2E_USERNAME z env
   - Sprawdź czy email jest widoczny na stronie
3. Zweryfikuj obecność sekcji zmiany hasła
4. Zweryfikuj obecność sekcji usuwania konta
5. Zweryfikuj obecność przycisku wylogowania

#### 9. Test: "should persist profile changes across sessions"

**Timeout:** 60s
**Fixture:** `authenticatedPage`
**OPCJONALNY:** Jeśli profil zawiera inne edytowalne pola (imię, avatar, etc.)
**Kroki:**

1. **Jeśli możliwa edycja profilu:**
   - Przejdź na /profile
   - Zmień jakieś dane profilu (np. imię)
   - Zapisz zmiany
   - Wyloguj się
   - Zaloguj się ponownie
   - Przejdź na /profile
   - Zweryfikuj że zmiany zostały zachowane

2. **Jeśli brak edycji profilu:**
   - Pomiń ten test lub zmień hasło i zweryfikuj persystencję (test 1)

## Pomocnicze funkcje

```typescript
// Tworzenie tymczasowego użytkownika do testów destrukcyjnych
async function createTemporaryUser(page: Page): Promise<{ email: string; password: string }> {
  const email = `temp-${Date.now()}@test.com`;
  const password = `TempPass123!`;

  const registerPage = new RegisterPage(page);
  await registerPage.goto("/register");
  await registerPage.waitForFormHydration();
  await registerPage.register(email, password, password);

  // WAŻNE: Rejestracja może auto-logować lub przekierować na /login
  // Obsłuż oba przypadki
  const currentUrl = page.url();

  if (currentUrl.includes("/login")) {
    // Przypadek 1: Przekierowano na /login - trzeba się zalogować
    const loginPage = new LoginPage(page);
    await loginPage.waitForFormHydration();
    await loginPage.login(email, password);
    await page.waitForURL("/");
  } else if (currentUrl.includes("/register")) {
    // Przypadek 2: Pozostało na /register - przekieruj i zaloguj
    await page.goto("/login");
    const loginPage = new LoginPage(page);
    await loginPage.waitForFormHydration();
    await loginPage.login(email, password);
    await page.waitForURL("/");
  }
  // Przypadek 3: Auto-login - już jesteśmy na /

  return { email, password };
}

// Helper function dla unikalnych emaili
function generateUniqueEmail(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}@test.com`;
}
```

## Wymagania techniczne

- Testy destrukcyjne (delete account, change password) używają tymczasowych użytkowników
- Weryfikuj stan po każdej akcji (success messages, redirects)
- Testuj zarówno happy path jak i validation errors
- Sprawdzaj persystencję zmian (logout + login)
- Dokumentuj skutki uboczne testów (usunięci użytkownicy)

## KRYTYCZNE: Bezpieczeństwo testów

- NIE usuwaj głównego użytkownika testowego (E2E_USERNAME)
- Dla testów delete account - twórz nowych użytkowników
- Dla testów change password - albo używaj temp user, albo przywracaj hasło

## Dostarcz

Pełny plik `tests/e2e/04-account-management.spec.ts` z wszystkimi testami
