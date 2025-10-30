# PROMPT 1: Konfiguracja infrastruktury testów E2E

## Kontekst

Tworzę od zera testy E2E dla aplikacji CulturAllyAI używając Playwright. Aplikacja jest zbudowana w Astro 5 + React 19 + TypeScript + Supabase.

## ⚠️ WAŻNE: Guidelines

Przed rozpoczęciem, przeczytaj i zastosuj guidelines z pliku:
**`.ai/rules/playwright-e2e-testing.mdc`**

Kluczowe zasady:

- Tylko Chromium/Desktop Chrome browser
- Page Object Model pattern (OBOWIĄZKOWY)
- Semantic locators (getByRole, getByLabel, getByText)
- Browser contexts dla izolacji
- Trace viewer dla debugowania
- Parallel execution

## KRYTYCZNE: Środowisko testowe

- Testy MUSZĄ używać `.env.test`, NIE `.env`
- Użytkownik testowy jest już utworzony w bazie testowej Supabase
- Dane z `.env.test`:
  - E2E_USERNAME=jan.nowak@gmail.com
  - E2E_PASSWORD=awxc56GH
  - E2E_USERNAME_ID=7ab0bb9b-4187-445c-8adb-356db4239de8
  - PUBLIC_SUPABASE_URL=https://kjdnwalzuawushnsvkbm.supabase.co

## Zadania

### 1. Skonfiguruj playwright.config.ts

- Załaduj zmienne z `.env.test` używając dotenv
- Ustaw baseURL na http://localhost:3000
- Użyj tylko projektu chromium (Desktop Chrome)
- Skonfiguruj webServer z komendą `npm run dev:test` (używa `.env.test`)
- Timeout: 30s dla standardowych testów
- Zachowaj trace, screenshot i video przy błędach
- Dodaj reporters: html, list, json

### 2. Stwórz fixtures.ts w tests/e2e/

- Zaimportuj test, Page z @playwright/test
- Zaimportuj AxeBuilder z @axe-core/playwright
- Stwórz interfejs AuthFixtures z:
  - makeAxeBuilder: () => AxeBuilder (dla testów accessibility)
  - authenticatedPage: Page (automatycznie zalogowana strona)
- Rozszerz base test o te fixtures
- W fixture authenticatedPage:
  - Pobierz credentials z process.env (E2E_USERNAME, E2E_PASSWORD)
  - Przejdź na /login
  - Poczekaj na hydratację formularza: `data-hydrated="true"` na `form[aria-label="Formularz logowania"]`
  - Wypełnij formularz używając getByLabel (email i hasło są po polsku)
  - Kliknij przycisk "Zaloguj się"
  - Poczekaj na przekierowanie na "/"
  - Przekaż zalogowaną stronę do testu

### 3. Zweryfikuj package.json scripts

Upewnij się że istnieją:

- `dev:test`: `cross-env ASTRO_ENV=test dotenv -e .env.test -- astro dev --mode test`
- `test:e2e`: `playwright test`
- `test:e2e:ui`: `playwright test --ui`
- `test:e2e:debug`: `playwright test --debug`

## Wymagania techniczne

- TypeScript strict mode
- Importy ES modules
- Używaj page.getByRole(), page.getByLabel(), page.getByText() zamiast selektorów CSS
- Wszystkie teksty UI są po POLSKU (przyciski, labele, nagłówki)
- Czekaj na hydratację React komponentów przed interakcją

## Dostarcz

1. Pełny plik `playwright.config.ts`
2. Pełny plik `tests/e2e/fixtures.ts`
3. Komendę do weryfikacji: `npx playwright test --list`
