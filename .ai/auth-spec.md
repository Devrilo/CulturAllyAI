# Specyfikacja architektury autentykacji CulturAllyAI

> **Fundament architektury:** Całość autentykacji opiera się na **Supabase Auth** - zarówno po stronie klienta (Supabase JS SDK), jak i serwera (weryfikacja JWT, Admin API). Nie tworzymy własnych mechanizmów auth, tylko wykorzystujemy gotowe rozwiązanie Supabase jako single source of truth.

## 1. Architektura interfejsu użytkownika

### 1.1 Layout i routing
- `src/layouts/Layout.astro` pozostaje wspólną warstwą obejmującą `AppHeader` oraz globalne style; wszystkie nowe widoki auth korzystają z tego samego layoutu, aby zachować spójność i nie naruszyć istniejących przepływów generatora.
- Widoki publiczne: `/` (Generator) pozostaje dostępny dla gości, natomiast toast i bannery (`AuthPromptBanner`) zachęcają do logowania, zgodnie z aktualnym planem UI.
- Widoki chronione: `/events` i `/settings` (z UI planu) będą wymagały aktywnej sesji. `Astro` na poziomie strony zweryfikuje żądanie poprzez `context.locals.supabase.auth.getUser()`, a w przypadku braku użytkownika zwróci redirect 302 na `/login?redirect=/events`.
- Widoki auth (publiczne):
  - `/login` – logowanie.
  - `/register` – rejestracja.
- Zgodność z istniejącym linkiem „Profil" w `Header.tsx`: docelowo `/profile` stanie się aliasem dla `/settings` (prosty redirect server-side), aby nie zrywać założonej w nagłówku nawigacji. W specyfikacji UI planu widok ustawień opisany jest pod ścieżką `/settings` i tak pozostaje głównym miejscem zarządzania kontem (w tym zmiana hasła).

### 1.2 Widoki i komponenty
- **Generator (`/`)**
  - Bez zmian względem bieżącej implementacji (`GeneratorPage.tsx`). Gating akcji „Zapisz" i oceny pozostaje oparte o `useSupabaseSession` (hook monitorujący `supabase.auth.onAuthStateChange`).
- **Logowanie (`/login`)**
  - Strona Astro: `src/pages/login.astro` renderuje `AuthPageLayout` (komponent Astro) oraz montuje klientowy komponent `LoginForm` (`client:load`).
  - `LoginForm` powstanie w `src/components/auth/LoginForm.tsx`. Wykorzysta:
    - Shadcn `Card`, `Input`, `Button`, `Alert` dla UI
    - **Supabase Auth SDK**: `supabase.auth.signInWithPassword()` dla logowania
    - Hook `useSupabaseSession` (oparty o `supabase.auth.getSession()` i `onAuthStateChange`) do automatycznego przekierowania zalogowanego użytkownika
- **Rejestracja (`/register`)**
  - Struktura analogiczna do `/login`, z komponentem `RegisterForm.tsx`. Formularz zawiera pola email, hasło, powtórzone hasło oraz wskaźnik siły hasła.
  - **Supabase Auth SDK**:
    - `supabase.auth.signUp({ email, password })` do utworzenia konta
    - Po sukcesie `supabase.auth.signInWithPassword()` w celu natychmiastowego zalogowania (Supabase nie loguje automatycznie po signUp w MVP bez potwierdzenia email)
- **Moje wydarzenia (`/events`)**
  - UI zgodnie z planem w `ui-plan.md`: React Query + infinite scroll. 
  - **Ochrona SSR przez Supabase**: Strona Astro weryfikuje sesję przed renderem używając `context.locals.supabase.auth.getUser()` (middleware automatycznie tworzy klienta z tokenem z cookies).
- **Ustawienia konta (`/settings`)**
  - Layout z sekcjami `ChangePasswordModal`, `DeleteAccountModal` opisany w UI planie pozostaje aktualny.
  - **Supabase Auth SDK dla zmiany hasła**: `supabase.auth.updateUser({ password })` bezpośrednio z klienta, następnie `supabase.auth.signOut()`.
  - **Supabase Admin API dla usuwania konta**: endpoint `POST /api/auth/delete-account` używa `supabaseAdmin.auth.admin.deleteUser()` po weryfikacji hasła przez `signInWithPassword`.

### 1.3 Komponenty i odpowiedzialności
- **Astro strony** odpowiadają za SSR, ochronę tras (przez `context.locals.supabase.auth.getUser()`) oraz przekazanie danych początkowych. Żadna z **operacji auth nie jest wykonywana bezpośrednio w kodzie Astro** – wszystkie akcje delegowane są do:
  - **Komponentów React klienckich** używających Supabase JS SDK (`signUp`, `signInWithPassword`, `signOut`, `updateUser`)
  - **Endpointów backendowych** używających Supabase Admin API dla operacji wymagających podwyższonych uprawnień
- **Komponenty React w `src/components/auth/`** (wszystkie używają Supabase Auth SDK)
  - `AuthPageShell.tsx` – wspólny wrapper (logo, nagłówki, linki pomocnicze).
  - `LoginForm.tsx` – wywołuje `supabase.auth.signInWithPassword()`, obsługa błędów `AuthError`.
  - `RegisterForm.tsx` – wywołuje `supabase.auth.signUp()` + automatyczne `signInWithPassword()`.
  - `AuthErrorAlert.tsx` – mapuje kody błędów Supabase (`AuthError`) na polskie komunikaty.
- **Komponenty React w `src/components/settings/`** (używają Supabase Auth SDK)
  - `ChangePasswordModal.tsx` – wywołuje `supabase.auth.updateUser({ password })`. Pola: nowe hasło, potwierdzenie (bez obecnego hasła).
  - `DeleteAccountModal.tsx` – wywołuje backend endpoint, który używa `supabaseAdmin.auth.admin.deleteUser()`.
- **Hooki oparte na Supabase Auth**
  - `useSupabaseSession` (już istnieje) - wrapper nad `supabase.auth.getSession()` i `supabase.auth.onAuthStateChange()`. Wykorzystywany wszędzie do sprawdzania stanu autentykacji.
  - Nowy hook `useAuthRedirect` - przechowuje `redirectTo` w `URLSearchParams` i obsługuje przekierowania po udanych akcjach Supabase Auth.

### 1.4 Walidacja i komunikaty błędów
- **Walidacja client-side** (przed wysłaniem do Supabase): `zod` schematy w `src/lib/validators/auth.ts` (`loginSchema`, `registerSchema`, `changePasswordSchema`, `deleteAccountSchema`). Błędy wyświetlane inline pod polami.
- **Walidacja Supabase Auth**: wszystkie formularze catch'ują `AuthError` z Supabase SDK i mapują kody błędów:
  - `Invalid login credentials` → "Nieprawidłowy email lub hasło"
  - `User already registered` → "Konto z tym adresem email już istnieje"
  - `New password should be different` → "Nowe hasło musi różnić się od obecnego"
  - `Weak password` → "Hasło jest zbyt słabe (min. 8 znaków)"
  - `Email not confirmed` → "Email nie został potwierdzony" (poza MVP)
- **Edge cases obsługiwane przez Supabase**:
  - Rate limiting (429) - Supabase automatycznie blokuje zbyt wiele prób
  - Timeout/connection issues - obsługa `network error` z SDK
  - Wszystkie błędy logowane z `error.code` i `error.message` (bez tokenów)

### 1.5 Kluczowe scenariusze
1. **Logowanie gościa**: baner na generatorze → `/login?redirect=/` → udane logowanie → Supabase zwraca sesję → `AppHeader` aktualizuje stan, następuje redirect na stronę główną `/` (zgodnie z PRD US-002).
2. **Rejestracja z generatora**: przycisk CTA → `/register?redirect=/` → sukces → automatyczne logowanie → powrót na `/` z toastem potwierdzającym, możliwość powtórzenia akcji „Zapisz" (zgodnie z PRD US-001).
3. **Zmiana hasła**: z `/settings` użytkownik otwiera modal → wprowadza nowe hasło i potwierdzenie (bez wymagania obecnego hasła - weryfikacja przez aktywną sesję JWT) → `supabase.auth.updateUser({ password })` → sukces → automatyczne wylogowanie → redirect na `/login` z komunikatem o konieczności ponownego zalogowania.
4. **Wygasła sesja**: próba akcji wymagającej auth (np. `PATCH /api/events/:id`) → backend zwraca 401 → klient wyświetla toast (już wspierany w generatorze) → redirect do `/login?redirect=...`.
5. **Usunięcie konta**: z `/settings` użytkownik otwiera modal → dwuetapowe potwierdzenie (wpisanie hasła + checkbox) → `POST /api/auth/delete-account` → backend usuwa użytkownika z `auth.users` (zgodnie z PRD US-003) → kaskadowe `ON DELETE SET NULL` zachowuje anonimizowane dane wydarzeń dla celów analitycznych → `supabase.auth.signOut` → redirect na `/login` z komunikatem.

## 2. Logika backendowa

> **Kluczowa zasada:** Backend **NIE implementuje własnej logiki autentykacji**. Wykorzystuje Supabase Auth jako dostawcę tożsamości poprzez weryfikację JWT i Admin API.

### 2.1 Konfiguracja i zależności (Supabase-first)
- **Istniejące middleware** (`src/middleware/index.ts`) zostaje rozszerzone:
  - Odczyt tokenów z cookies Supabase (`sb-access-token`, `sb-refresh-token`) ustawianych automatycznie przez Supabase JS SDK
  - Jeśli nagłówek `Authorization` nie jest dostępny (SSR), middleware pobiera token z ciasteczka i tworzy klienta Supabase z tym tokenem
  - Dzięki temu `context.locals.supabase.auth.getUser()` działa zarówno dla żądań API, jak i SSR stron
- **Dwa typy klientów Supabase**:
  1. **Klient z anonimowym kluczem** (`SUPABASE_ANON_KEY`) - używany wszędzie domyślnie, weryfikuje JWT użytkownika
  2. **Klient z kluczem serwisowym** (`SUPABASE_SERVICE_ROLE_KEY`) - nowy helper w `src/db/server-supabase.client.ts`, używany TYLKO dla:
     - `supabaseAdmin.auth.admin.deleteUser()` (usuwanie konta)
     - Zapisów do `user_activity_logs` (bypass RLS dla audytu)
- **Zero własnej logiki auth** - wszystkie decyzje (czy token ważny, czy użytkownik istnieje, itp.) podejmuje Supabase.

### 2.2 Endpointy Astro (pomocnicze, nie zastępują Supabase Auth)
- **❌ Brak endpointów do logowania/rejestracji** – zgodnie z aktualnym CHANGELOG wszystkie operacje auth idą **bezpośrednio do Supabase API** przez SDK po stronie klienta (`supabase.auth.signUp`, `signInWithPassword`, `signOut`, `updateUser`).
- **✅ Nowe endpointy wspierające** (nie zastępują Supabase, tylko go uzupełniają):
  - `POST /api/auth/activity` – **audyt**: zapisuje zdarzenia w `user_activity_logs` po akcjach Supabase (`account_created`, `login`, `logout`, `password_changed`, `account_deleted`).
    - Weryfikacja tożsamości: `context.locals.supabase.auth.getUser()` (dekoduje JWT od Supabase)
    - Zapis przez klucza serwisowego (bypass RLS dla tabeli logów)
  - `POST /api/auth/delete-account` – **jedyna operacja wymagająca backendu**: usunięcie konta.
    - Weryfikacja hasła: `supabaseAdmin.auth.signInWithPassword()` (używamy Supabase do weryfikacji!)
    - Usunięcie: `supabaseAdmin.auth.admin.deleteUser(userId)` (Supabase Admin API)
    - Logowanie akcji przed usunięciem
- **Zasada**: endpointy są **cienką warstwą** nad Supabase, nie implementują własnej logiki auth.

### 2.3 Walidacja i DTO
- Nowy plik `src/lib/validators/auth.ts` zawiera:
  - `emailSchema` – walidacja formatu email.
  - `passwordSchema` – min. 8 znaków, zawiera litery i cyfry.
  - `loginSchema`, `registerSchema`, `changePasswordSchema`, `deleteAccountSchema`, `authActivitySchema`.
- W `src/types.ts` dodamy DTO:
  - `AuthActivityDTO` – payload logowania akcji (action_type: user_action_type).
  - `DeleteAccountRequestDTO` – payload z hasłem użytkownika do weryfikacji.
  - `ChangePasswordRequestDTO` – payload z nowym hasłem i potwierdzeniem (bez obecnego hasła - weryfikacja przez sesję JWT).
- Endpointy zwracają `MessageResponseDTO` lub `ErrorResponseDTO` (już zdefiniowane), aby zachować spójność.

### 2.4 Obsługa wyjątków (delegacja do Supabase)
- **Serwerowa warstwa auth** (`src/lib/services/auth.service.ts`) jest **cienkim wrapperem** nad Supabase Admin API:
  - Wszystkie błędy autentykacji pochodzą od Supabase (`AuthApiError`, `AuthError`)
  - Backend NIE decyduje o ważności tokenów - przekazuje je do Supabase przez `auth.getUser()`
  - Backend NIE weryfikuje haseł - używa `supabase.auth.signInWithPassword()` do delegacji weryfikacji
- **Mapa błędów Supabase** (przepisywanie kodów na HTTP status):
  - Supabase `invalid_credentials` → 400/401 (błędne hasło/token)
  - Supabase `user_not_found` → 404
  - Supabase `jwt_expired` → 401 (wygasły token)
  - Supabase rate limit → 429
  - Supabase API error → 500/503
- **Logika `try-catch`**: catch'uje `AuthApiError` z Supabase SDK, loguje (`console.error` + `AuthServiceError`), próbuje zapisać audit log.

### 2.5 Renderowanie server-side (weryfikacja przez Supabase)
- **Astro SSR dla `/events` i `/settings`**:
  ```typescript
  // Weryfikacja sesji PRZEZ SUPABASE (nie własną logiką)
  const { data: { user }, error } = await context.locals.supabase.auth.getUser();
  
  if (!user || error) {
    return Astro.redirect(`/login?redirect=${Astro.url.pathname}`);
  }
  ```
- **Hydratacja klienta**: przekazanie `initialSession` w props (Supabase automatycznie ustawi sesję w localStorage)
- **AppHeader**: pozostaje komponentem klientowym używającym `useSupabaseSession` (hook oparty o `supabase.auth.onAuthStateChange`).

## 3. System autentykacji (w 100% Supabase Auth)

> **Wszystkie operacje auth wykonywane są przez Supabase Auth SDK/API - zero własnej implementacji.**

### 3.1 Rejestracja (Supabase `signUp` + `signInWithPassword`)
1. Formularz `RegisterForm` - walidacja lokalna (zod: email format, hasło min. 8 znaków, zgodność haseł)
2. **Supabase Auth SDK**: `await supabase.auth.signUp({ email, password })`
   - Supabase tworzy użytkownika w tabeli `auth.users`
   - Supabase hashuje hasło (bcrypt)
   - Supabase zwraca `user` i `session` (lub błąd `AuthError`)
3. **Automatyczne logowanie** (bo MVP bez email confirmation): `await supabase.auth.signInWithPassword({ email, password })`
   - Supabase generuje JWT access token
   - SDK automatycznie zapisuje token do localStorage
4. Audyt: `POST /api/auth/activity` z `account_created` (opcjonalne, nie blokuje przepływu)
5. Przekierowanie na stronę główną `/` (zgodnie z PRD US-001: "Po pomyślnej rejestracji użytkownik zostaje automatycznie zalogowany")

### 3.2 Logowanie (Supabase `signInWithPassword`)
1. `LoginForm` - walidacja lokalna (zod: email format, hasło niepuste)
2. **Supabase Auth SDK**: `await supabase.auth.signInWithPassword({ email, password })`
   - Supabase weryfikuje email i hasło (bcrypt hash comparison)
   - Supabase generuje JWT access token i refresh token
   - SDK automatycznie zapisuje tokeny do localStorage
   - SDK wywołuje `onAuthStateChange` callback → `useSupabaseSession` wykrywa logowanie
3. Catch `AuthError`:
   - `Invalid login credentials` - błędny email/hasło
   - `Email not confirmed` - email niepotwierdzony (poza MVP)
4. Audyt: `POST /api/auth/activity` z `login` (opcjonalne)
5. Przekierowanie na stronę główną `/` (zgodnie z PRD US-002: "Po pomyślnym zalogowaniu użytkownik zostaje przekierowany na stronę główną") lub na `redirectTo` z URL params jeśli użytkownik próbował dostać się do chronionego zasobu

### 3.3 Wylogowanie (Supabase `signOut`)
- Metoda `handleSignOut` w `AppHeader`:
  1. Audyt (opcjonalnie): `POST /api/auth/activity` z `logout` przed wylogowaniem
  2. **Supabase Auth SDK**: `await supabase.auth.signOut()`
     - Supabase unieważnia refresh token w bazie
     - SDK czyści localStorage (usuwa tokeny)
     - SDK wywołuje `onAuthStateChange` → `useSupabaseSession` wykrywa wylogowanie
     - Wszystkie komponenty automatycznie aktualizują stan
  3. Redirect na `/login` (zgodnie z PRD US-010: "Przekierowanie na stronę logowania po wylogowaniu")

### 3.4 Zmiana hasła (Supabase `updateUser`)
- Modal `ChangePasswordModal` w `/settings` - wymaga aktywnej sesji
- Pola: nowe hasło, potwierdzenie nowego hasła (walidacja lokalna zod)
- **NIE wymaga obecnego hasła** - Supabase weryfikuje tożsamość przez aktywną sesję JWT, co jest bezpieczniejsze (sesja może być odwołana)
- **Przepływ przez Supabase Auth**:
  1. **Supabase Auth SDK**: `await supabase.auth.updateUser({ password: newPassword })`
     - Supabase automatycznie weryfikuje aktualną sesję (JWT) - to zastępuje wymóg podania starego hasła
     - Supabase hashuje nowe hasło (bcrypt)
     - Supabase wymusza różnicę od starego hasła (walidacja wewnętrzna)
  2. Catch `AuthError`:
     - `New password should be different` - hasło takie same jak obecne
     - `Weak password` - hasło zbyt słabe (min. 8 znaków, litery + cyfry)
     - `jwt_expired` / `invalid_jwt` - sesja wygasła (użytkownik musi zalogować się ponownie)
  3. Po sukcesie: audyt `POST /api/auth/activity` (`password_changed`)
  4. Wylogowanie: `await supabase.auth.signOut()` (wymuś ponowne logowanie z nowym hasłem dla bezpieczeństwa)
  5. Redirect na `/login` z toastem: "Hasło zmienione. Zaloguj się ponownie."

### 3.5 Usuwanie konta (Supabase Admin API `deleteUser`)
- Modal `DeleteAccountModal` w `/settings` - wymaga aktywnej sesji i potwierdzenia hasłem
- **Przepływ przez backend endpoint** (jedyna operacja wymagająca backendu):
  1. Klient: `POST /api/auth/delete-account` z `{ password }`
  2. **Backend weryfikuje hasło PRZEZ SUPABASE**: 
     ```typescript
     // Używamy Supabase do weryfikacji hasła (nie implementujemy własnej)
     const { data, error } = await supabaseAdmin.auth.signInWithPassword({ 
       email: user.email, 
       password 
     });
     if (error) return 401; // Supabase odrzucił hasło
     ```
  3. **Backend używa Supabase Admin API**:
     ```typescript
     await supabaseAdmin.auth.admin.deleteUser(userId);
     // Supabase usuwa użytkownika z auth.users (zgodnie z PRD US-003)
     // ON DELETE SET NULL w tabeli events zachowuje anonimizowane wydarzenia
     // Pozwala to na analizę agregowanych danych bez naruszania RODO
     ```
  4. Audyt: zapis `account_deleted` do `user_activity_logs` (przed usunięciem użytkownika)
  5. Backend zwraca 200
  6. Klient: `await supabase.auth.signOut()` + redirect `/login` z toastem "Konto zostało usunięte"
- **Zasada**: backend deleguje weryfikację hasła i usuwanie do Supabase, nie implementuje własnej logiki
- **Zgodność z PRD**: Użytkownik jest usunięty z `auth.users`, jego dane osobowe (email, hasło) są usunięte. Wydarzenia pozostają z `user_id=NULL` dla celów statystycznych (nie narusza RODO - dane anonimizowane).

### 3.6 Utrzymanie sesji i autoryzacja (w pełni przez Supabase)
- **Single source of truth**: `supabase.auth.onAuthStateChange()` (Supabase SDK)
  - Automatyczna obsługa refresh tokenów przez Supabase SDK
  - Automatyczne zapisywanie/odczyt z localStorage przez Supabase SDK
  - Hook `useSupabaseSession` jest tylko wrapperem nad Supabase SDK
- **Tokeny JWT (zarządzane przez Supabase)**:
  - Access token: JWT podpisany kluczem Supabase, TTL ~1h
  - Refresh token: długotrwały token, automatyczne odświeżanie przez SDK
  - Storage: localStorage (default Supabase) lub cookies (SSR)
- **Autoryzacja w API endpointach**:
  ```typescript
  // Backend NIE weryfikuje JWT samodzielnie - deleguje do Supabase
  const { data: { user }, error } = await context.locals.supabase.auth.getUser();
  // Supabase dekoduje JWT, weryfikuje sygnaturę, sprawdza expiry
  if (!user) return 401;
  ```
- **Klient dołącza token**: interceptory w React Query dodają `Authorization: Bearer ${token}` - token pobierany z `supabase.auth.getSession()`

### 3.7 Bezpieczeństwo (delegowane do Supabase)
- **Hashowanie haseł**: bcrypt przez Supabase (nie implementujemy własnego)
- **Weryfikacja JWT**: Supabase weryfikuje sygnatury tokenów (klucz JWT w Supabase secrets)
- **Row Level Security (RLS)**: polityki w `events` bazują na `auth.uid()` (funkcja Supabase zwracająca user_id z JWT)
  ```sql
  -- RLS używa Supabase auth.uid() - nie własnej logiki
  create policy "Users can view own events"
    on events for select
    using (auth.uid() = user_id);
  ```
- **Rate limiting**: wbudowany w Supabase Auth (automatyczna ochrona przed brute-force)
- **Audyt bez RLS**: `user_activity_logs` zapisywane przez service role key (bypass RLS), aby uniknąć manipulacji logami przez użytkowników
- **Bezpieczeństwo tokenów**:
  - Tokeny NIE trafiają do logów (tylko `error.code`, `error.message`)
  - Refresh token rotation (Supabase automatycznie)
  - JWT zawiera tylko `user_id`, `email`, `role` - bez wrażliwych danych

### 3.8 Zgodność z wymaganiami
- **PRD historyjki w 100% przez Supabase Auth**:
  - US-001 (rejestracja) → `supabase.auth.signUp()` + automatyczne logowanie + redirect na `/`
  - US-002 (logowanie) → `supabase.auth.signInWithPassword()` + redirect na `/` lub `redirectTo`
  - US-003 (zarządzanie kontem) → 
    - Zmiana hasła: `supabase.auth.updateUser({ password })` bez wymagania obecnego hasła (weryfikacja przez sesję JWT)
    - Usunięcie konta: `supabaseAdmin.auth.admin.deleteUser()` usuwa użytkownika z `auth.users`, anonimizuje wydarzenia (ON DELETE SET NULL)
  - US-010 (wylogowanie) → `supabase.auth.signOut()` + redirect na `/login`
- **Wyjaśnienie US-003 "Wszystkie dane użytkownika zostają usunięte"**:
  - ✅ Dane osobowe (email, hasło) są całkowicie usunięte z `auth.users`
  - ✅ Logi aktywności użytkownika są usuwane (kaskadowo)
  - ⚠️ Wydarzenia pozostają z `user_id=NULL` (anonimizacja zgodna z RODO)
  - **Uzasadnienie**: Zachowanie anonimizowanych wydarzeń umożliwia analizę statystyczną bez naruszania prywatności (wymóg KPI z sekcji 6 PRD)
- **Poza zakresem MVP:** 
  - Reset hasła przez email (`supabase.auth.resetPasswordForEmail()` - dostępne w Supabase, ale nie używamy w MVP)
  - Email confirmation (`supabase.auth.verifyOtp()` - dostępne, ale nie wymagamy w MVP)
- **Kluczowa decyzja architektoniczna**: 
  - ✅ **Używamy Supabase Auth jako single source of truth**
  - ❌ **Nie implementujemy własnej logiki autentykacji/autoryzacji**
  - ✅ **Backend jest cienką warstwą nad Supabase API**
- Stack: Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui + **Supabase Auth (fundament wszystkiego)**
