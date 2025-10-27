# Plan Testów CulturAllyAI

## 1. Wprowadzenie i cele testowania
- Zapewnienie, że generowanie opisów wydarzeń na podstawie danych użytkownika działa zgodnie z PRD i nie dodaje nieautoryzowanych informacji.
- Weryfikacja bezpieczeństwa i integralności danych użytkownika (Supabase Auth, RLS, logowanie zdarzeń).
- Potwierdzenie stabilności przepływów krytycznych: rejestracja/logowanie, generacja i zapis opisu, edycja, ocenianie, kopiowanie.
- Zapewnienie pełnej lokalizacji interfejsu i komunikatów na język polski.

## 2. Zakres testów
- UI: strony Astro (`/`, `/login`, `/register`, `/profile`, `/events`) oraz komponenty React (formularz generatora, lista wydarzeń, modale ustawień).
- API Astro (`/api/events`, `/api/events/:id`, `/api/categories/*`, `/api/auth/*`).
- Integracje: Supabase (Auth, PostgREST, RLS), Openrouter.ai (generowanie opisów), clipboard w przeglądarce.
- Walidacje Zod (`src/lib/validators`) i logika usług (`src/lib/services`).
- Migracje Supabase i polityki RLS.
- Dokumentacja i plany testów manualnych w `docs/manual-tests`.

## 3. Typy testów
- Testy jednostkowe (React hooks, usługi, walidatory Zod) – Vitest + @testing-library/react.
- Testy integracyjne backendu (Astro API z mockiem Supabase/Openrouter) – Nock dla HTTP mocking.
- Testy end-to-end (Playwright) – scenariusze krytyczne użytkownika, wieloprzeglądarkowe, RWD.
- Testy bazy danych (RLS policies, migracje) – testcontainers-node z izolowanym Postgres.
- Testy manualne zgodnie z istniejącymi planami w `docs/manual-tests`.
- Testy bezpieczeństwa (RLS, open redirect, ochrona przed XSS, token handling).
- Testy wydajnościowe i odporności (k6 dla load testing, stress testing, timeouts).
- Testy dostępności (@axe-core/playwright automatyzacja, axe DevTools manual, WAVE weryfikacja).
- Testy visual regression (Playwright snapshots dla wykrywania zmian CSS/layout).
- Testy pokrycia kodu (@vitest/coverage-v8 z wymogiem min. 80% dla walidatorów i usług).
- Testy regresyjne przy każdej migracji Supabase i zmianie modeli AI.

## 4. Scenariusze testowe kluczowych funkcjonalności
- Generowanie wydarzenia (gość/zalogowany): limity znaków, walidacja daty, obsługa błędów AI/timeout.
- Zapis wydarzenia: blokada podwójnego zapisu, aktualizacja UI, log w `event_management_logs`.
- Lista zapisanych wydarzeń (`/events`): filtry, sortowanie, infinite scroll, edycja inline z limitami, miękkie usuwanie.
- Ocena opisu (kciuk w górę/dół): jednokrotność oceny, blokady w UI, aktualizacja feedback.
- Kopiowanie do schowka: potwierdzenie, działanie w różnych przeglądarkach.
- Rejestracja/logowanie/wylogowanie: walidacje, redirecty, obsługa błędów Supabase, sesje.
- Zmiana hasła/usuwanie konta: potwierdzenia, anonimizacja danych, logowanie aktywności.
- Pobieranie kategorii (publiczne API) i caching.
- Tryb ciemny/jaśniejszy, zachowanie preferencji, dostępność kontrastu.
- Middleware i SSR: ochrona tras, przekierowania, obsługa tokenów w cookies.

## 5. Środowisko testowe
- Dev: lokalne środowisko `npm run dev`, Supabase CLI (`supabase start`) i `supabase db reset` z migracjami.
- Test: odseparowana instancja Supabase (klucze testowe), mock Openrouter lub sandboxowy klucz, feature flags.
- Prod-symulacja: build `npm run build` + `astro preview` w kontenerze, konfiguracja secrets (GitHub Actions/DigitalOcean).
- Dane testowe: przygotowane konta (`test.user@gmail.com` itd.), predefiniowane wydarzenia wg manualnych planów.

## 6. Narzędzia do testowania

### Testy jednostkowe i integracyjne
- **Vitest** + **@vitest/coverage-v8** – framework testowy z pokryciem kodu (min. 80%)
- **@testing-library/react** + **@testing-library/dom** – testowanie komponentów React
- **Nock** – mockowanie HTTP requests w testach Node.js/Astro backend
- **msw (Mock Service Worker)** – mockowanie API dla testów komponentów React

### Testy E2E i przeglądarki
- **Playwright** – testy E2E wieloprzeglądarkowe (Chrome, Firefox, Safari, Edge)
- **Playwright Trace Viewer** – debugging testów E2E z time-travel
- **Playwright Codegen** – generowanie testów z nagranych interakcji

### Testy wydajnościowe
- **k6** – load testing, stress testing, smoke testing API (JavaScript-based)

### Testy dostępności
- **@axe-core/playwright** – automatyzacja testów a11y w CI/CD (WCAG 2.1 AA)
- **axe DevTools** – manual testing (Chrome/Firefox extension)
- **WAVE** – dodatkowa weryfikacja manualna (web-based)

### Testy bazy danych
- **@supabase/supabase-js** – klient Supabase dla testów integracyjnych
- **testcontainers-node** – izolowane środowiska PostgreSQL dla testów RLS i migracji

### Testy visual regression
- **Playwright Screenshots** – snapshot testing dla wykrywania zmian wizualnych

### Narzędzia wspierające
- **ESLint** + **Prettier** – linting i formatting z pre-commit hooks (Husky)
- **Supabase CLI** – lokalne środowisko dev, migracje, seedy
- **GitHub Actions** – CI/CD pipeline (`lint` → `test` → `e2e` → `build`)
- **PowerShell Invoke-RestMethod** – testy manualne API (zgodnie z `docs/manual-tests`)
- **Vitest UI** – interaktywny interfejs do uruchamiania testów jednostkowych
- **Pact.io** (opcjonalnie) – contract testing między frontend/backend

### Narzędzia do analizy
- **eslint-plugin-jsx-a11y** – statyczna analiza dostępności w kodzie
- **TypeScript** – type checking jako część testów (tsc --noEmit)

## 7. Harmonogram testów
- Planowanie i przygotowanie środowiska: 1 tydzień (sync z zespołem dev).
- Testy jednostkowe/integracyjne: ciągłe, wymagane przed każdym merge do `master`.
- Testy E2E regresyjne: przed każdym release MVP, następnie cykl tygodniowy.
- Testy manualne krytyczne (z `docs/manual-tests`): przed releasem i po zmianach w API/AI.
- Testy wydajnościowe/sekuracyjne: cykl dwutygodniowy lub po istotnych zmianach infrastruktury.
- Retest błędów + smoke test: w ciągu 24h od naprawy.
- UAT z interesariuszami: ostatni tydzień sprintu release.

## 8. Kryteria akceptacji testów
- **Pokrycie kodu:** min. 80% dla `src/lib/validators` i `src/lib/services` (weryfikacja przez @vitest/coverage-v8).
- **Testy jednostkowe:** 100% testów zielonych, brak flaky tests (max 1% retry rate).
- **Testy E2E:** wszystkie critical path scenariusze przechodzą w 3 przeglądarkach (Chrome, Firefox, Safari).
- **Wszystkie scenariusze z sekcji 4** zakończone sukcesem (automatyczne lub manualne z `docs/manual-tests`).
- **Defekty:** brak krytycznych/blokerów; defekty wysokie z planem naprawy przed release.
- **Wydajność (k6):**
  - `POST /api/events` < 2s w 95 percentylu przy 100 RPS
  - `GET /api/events` < 500ms w 95 percentylu przy 200 RPS
  - `GET /api/categories/*` < 100ms w 99 percentylu (cache)
- **Bezpieczeństwo:** 
  - RLS policies przetestowane z testcontainers (unauthorized access blocked)
  - Brak open redirect vulnerabilities (verified by security tests)
  - Secure cookie handling (httpOnly, sameSite, secure flags)
  - XSS protection verified przez Content Security Policy tests
- **Dostępność:** 
  - 0 critical/serious violations w @axe-core/playwright (WCAG 2.1 AA)
  - Keyboard navigation działa na wszystkich kluczowych przepływach
  - Screen reader compatibility verified (NVDA/JAWS)
- **Visual regression:** 0 unexpected snapshot failures w Playwright.
- **Database:** wszystkie migracje Supabase przechodzą w testcontainers bez błędów.
- **Dokumentacja:** README, docs, CHANGELOG.md zaktualizowane po zmianach funkcjonalności.

## 9. Role i odpowiedzialności
- QA Lead: planowanie testów, koordynacja prac, raportowanie statusu, decyzje Go/No-Go.
- QA Engineerzy: przygotowanie przypadków, automatyzacja, wykonanie testów manualnych, utrzymanie narzędzi.
- Developerzy: wsparcie w tworzeniu testów jednostkowych/integracyjnych, szybkie reagowanie na defekty, przeglądy kodu.
- DevOps: konfiguracja środowisk testowych, pipeline CI/CD, monitorowanie logów.
- Product Owner/Analityk: weryfikacja kryteriów akceptacji PRD, UAT.
- Security Specialist (ad hoc): przegląd konfiguracji Supabase, tajnych kluczy i logiki auth.

## 10. Procedury raportowania błędów
- Rejestrowanie defektów w systemie (np. Jira/Azure Boards) z: tytułem, opisem, krokami, oczekiwanym vs. rzeczywistym rezultatem, zrzutami ekranów/logami, priorytetem i etykietą komponentu.
- Automatyczne logi z CI (lint/test/E2E) dołączane do zgłoszeń.
- SLA reakcji: krytyczne ≤4h, wysokie ≤1 dzień roboczy, średnie ≤2 dni, niskie ≤5 dni.
- Triage dzienny z udziałem QA + Dev + PO; przypisywanie właścicieli.
- Retest + regresja po wdrożeniu poprawek, aktualizacja statusu defektu w systemie.
- Raport zbiorczy po każdym cyklu testowym z metrykami (liczba defektów wg priorytetu, pokrycie testowe, ryzyka otwarte).
