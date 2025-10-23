# Architektura UI dla CulturAllyAI

## 1. Przegląd struktury UI

Interfejs został zaprojektowany w podejściu "guest-first", zapewniając natychmiastowy dostęp do generatora opisów przy jednoczesnym zachęcaniu do rejestracji po wykonaniu kluczowych akcji. Struktura dzieli aplikację na strefę publiczną (generator) i strefę chronioną (lista wydarzeń oraz ustawienia konta), odzwierciedlając wymagania PRD i planu API. Główne przepływy obejmują generowanie opisu (POST `/api/events`), zarządzanie zapisanymi wydarzeniami (GET/PATCH/DELETE `/api/events/:id`) oraz obsługę konta użytkownika przy wykorzystaniu Supabase Auth po stronie klienta. UI wykorzystuje Astro + React, React Query do stanu serwerowego i Tailwind 4 dla layoutu, zapewniając responsywność, dostępność (ARIA, focus management) oraz zgodność z wymogami bezpieczeństwa (kontrola sesji, obsługa błędów i timeoutów). Bazą warstwy prezentacji są komponenty Shadcn/ui dostosowane do design systemu aplikacji. Linearna struktura formularza (Tytuł → Data wydarzenia → Miasto "Gdzie?" → Kategoria → Kategoria wiekowa "Dla kogo?" → Najważniejsze informacje) oraz lean state management (React useState + React Query + Supabase SDK + URL params) wynikają bezpośrednio z decyzji projektowych.

## 2. Lista widoków

### Widok: Generator Wydarzeń

- **Nazwa widoku:** Generator
- **Ścieżka widoku:** `/`
- **Główny cel:** Umożliwić generowanie i ocenianie opisów wydarzeń zarówno gościom, jak i zalogowanym użytkownikom.
- **Powiązane historyjki:** US-004 (generowanie opisu), US-005 (kopiowanie tekstu), US-006 (zapisywanie opisów), US-007 (ocena trafności), US-008 (kontynuacja pracy po zapisaniu), US-010 (wylogowanie z poziomu nagłówka).
- **Wykorzystywane endpointy/SDK:** `GET /api/categories/events`, `GET /api/categories/age`, `POST /api/events`, `PATCH /api/events/:id`, Supabase Auth SDK (`getSession`, `signOut`).
- **Kluczowe informacje do wyświetlenia:** Formularz z liniowo ułożonymi polami i ustalonymi etykietami (Tytuł, Data wydarzenia, Miasto z opisem "Gdzie?", Kategoria wydarzenia, Kategoria wiekowa z opisem "Dla kogo?", Najważniejsze informacje z licznikiem 200 znaków), podgląd opisu z licznikiem 500 znaków oraz statusem zapisu/oceny, komunikaty walidacyjne i błędów generowania.
- **Kluczowe komponenty widoku:** `EventForm`, `DescriptionPreview`, `ActionButtons` (Generuj, Zapisz, Kopiuj z ikoną w prawym górnym rogu), `RatingButtons` (kciuk ↑ zielony #16a34a / kciuk ↓ czerwony #dc2626, Lucide), `Toast` (autozamknięcie 2 s), `LoadingSkeleton`, `Spinner`, `TimeoutNotice` (>10 s), `AuthPromptBanner`.
- **UX, dostępność i względy bezpieczeństwa:** Realtime validation z komunikatami inline (PRD 3.1), blokada formularza i stan disabled wszystkich pól podczas żądań POST `/api/events`, skeleton + spinner + tekst "Generowanie..." widoczny w `DescriptionPreview`, przycisk „Zapisz” i oceny warunkowo aktywne dla uwierzytelnionych użytkowników (weryfikacja Supabase session), aria-invalid/aria-describedby dla błędów, toast po kopiowaniu (2 s) i w przypadku konieczności logowania, obsługa retry i komunikatu modalnego dla błędów 500/503, fallback informujący o wymaganym ponownym logowaniu (401), zabezpieczenie przed ponowną oceną poprzez zablokowanie przycisków po wyborze.

### Widok: Moje Wydarzenia

- **Nazwa widoku:** Moje Wydarzenia
- **Ścieżka widoku:** `/events`
- **Główny cel:** Zapewnić zalogowanym użytkownikom listę zapisanych wydarzeń oraz pełne zarządzanie nimi.
- **Powiązane historyjki:** US-006 (utrzymanie zapisanych opisów), US-007 (ocenianie trafności), US-008 (przegląd zapisanych), US-009 (edycja opisów), US-003 (przejście do ustawień z nagłówka), US-010 (wylogowanie z menu użytkownika).
- **Wykorzystywane endpointy/SDK:** `GET /api/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`, Supabase Auth SDK (`getSession`, `signOut`).
- **Kluczowe informacje do wyświetlenia:** Lista kart wydarzeń obejmująca wyłącznie zapisane pozycje użytkownika (tytuł, meta: data/miasto, badge kategorii, pełny opis w aktualnej wersji, status oceny), filtry (kategoria, kategoria wiekowa), sortowanie (created_at domyślnie), licznik zapisanych, komunikaty pustej listy, wskaźniki ładowania przy infinite scroll.
- **Kluczowe komponenty widoku:** `EventList` z React Query (GET `/api/events`, paginowane po 20 pozycji), `EventCard` (bez wskaźnika oceny poza ikonami kciuków), `FiltersBar`, `SortSelect`, `InlineEditArea` (textarea 500 znaków), `CopyButton`, `DeleteAction` z `ConfirmationModal`, `InfiniteScrollObserver` z przyciskiem fallback „Wczytaj więcej”, `EmptyState`, `Toast` (sukces/błąd), `ErrorBoundary` (401/403 redirect, 500 modal retry).
- **UX, dostępność i względy bezpieczeństwa:** Widok chroniony (middleware Supabase -> redirect na `/login`), focus trap w modalach, aria-live dla toastów, debounce filtrów z synchronizacją do URL params, optimistic updates dla edycji (`PATCH /api/events/:id`) i usuwania (`DELETE /api/events/:id`) z rollbackiem przy błędzie, disabled akcje po usunięciu/ocenie, ochrona przed wielokrotną oceną poprzez stan lokalny + backend validation, komunikaty inline dla 400 oraz toast + redirect dla 401/403, modale retry dla 500/503.

### Widok: Logowanie

- **Nazwa widoku:** Logowanie
- **Ścieżka widoku:** `/login`
- **Główny cel:** Umożliwić istniejącym użytkownikom zalogowanie się i kontynuowanie pracy.
- **Powiązane historyjki:** US-002 (logowanie), US-006/US-007/US-008/US-009 (kontynuacja zapisu i zarządzania po logowaniu), US-010 (docelowa strona po wylogowaniu).
- **Wykorzystywane endpointy/SDK:** Supabase Auth SDK (`signInWithPassword`, `getSession`).
- **Kluczowe informacje do wyświetlenia:** Formularz (Email, Hasło), link do rejestracji, komunikaty o błędach Supabase Auth, stan ładowania.
- **Kluczowe komponenty widoku:** `AuthForm` (tryb login), `Card` layout, `SubmitButton` ze stanem ładowania, `PasswordInput` z możliwością pokazania hasła, `AuthErrorAlert`, `RedirectNotice` po sukcesie, `Toast` informujący o logowaniu wymaganym do zapisu/oceny (jeżeli przekierowano z generatora).
- **UX, dostępność i względy bezpieczeństwa:** Walidacja email/hasła przed wysłaniem, obsługa błędów Supabase (np. `Invalid login credentials`) jako aria-live, automatyczne przekierowanie na `/` po zalogowaniu, zapamiętywanie docelowej ścieżki (np. po próbie zapisu wydarzenia), zabezpieczenie przed brute-force (wyświetlanie ogólnych błędów), komunikaty w języku polskim.

### Widok: Rejestracja

- **Nazwa widoku:** Rejestracja
- **Ścieżka widoku:** `/register`
- **Główny cel:** Pozwolić nowym użytkownikom utworzyć konto, automatycznie zalogować się i wrócić do generatora.
- **Powiązane historyjki:** US-001 (rejestracja), US-004/US-006 (kontynuacja generowania i zapisywania po rejestracji), US-010 (opcjonalne wylogowanie po utworzeniu konta).
- **Wykorzystywane endpointy/SDK:** Supabase Auth SDK (`signUp`, `signInWithPassword`).
- **Kluczowe informacje do wyświetlenia:** Formularz (Email, Hasło, Potwierdzenie hasła), wymagania hasła (≥8 znaków), alerty błędów Supabase (np. duplikat email), link do logowania.
- **Kluczowe komponenty widoku:** `AuthForm` (tryb register), `PasswordStrengthHint`, porównanie haseł z realtime feedback, `SubmitButton`, `SuccessToast` informujący o automatycznym logowaniu, `RedirectNotice` z CTA powrotu do generatora.
- **UX, dostępność i względy bezpieczeństwa:** Etykiety i komunikaty aria-live, maskowanie hasła z opcją podglądu, focus management po błędach, natychmiastowe zalogowanie i przekierowanie z zachowaniem stanu formularza generatora (opcjonalny kontekst), wyświetlenie CTA powrotu do generatora.

### Widok: Ustawienia Konta

- **Nazwa widoku:** Ustawienia
- **Ścieżka widoku:** `/settings`
- **Główny cel:** Umożliwić zarządzanie kontem (zmiana hasła, usunięcie konta) i przegląd danych profilu.
- **Powiązane historyjki:** US-003 (zarządzanie kontem), US-010 (wylogowanie), US-002/US-001 (podtrzymanie lub odnowienie sesji po zmianach), US-006/US-008 (wpływ operacji na dostęp do zapisanych wydarzeń).
- **Wykorzystywane endpointy/SDK:** Supabase Auth SDK (`updateUser`, `signOut`), dedykowany endpoint backendowy lub Supabase Management API do trwałego usunięcia konta (TBD, zabezpieczony kluczem serwisowym), ewentualne odświeżenia danych (np. `GET /api/events`) po zmianach sesji.
- **Kluczowe informacje do wyświetlenia:** Adres email (read-only), przyciski „Zmień hasło” i „Usuń konto”, potwierdzenia działań, status operacji.
- **Kluczowe komponenty widoku:** `AccountManagementSection`, `ChangePasswordModal` (Supabase `updateUser`), `DeleteAccountModal` (wywołanie funkcji backendowej lub Supabase Management API), `Success/ErrorToast`, `DangerZoneCard`, `SessionStatusBanner` (info o wylogowaniu po zmianie), `ConfirmationPrompt` wymagający ręcznego wpisania tekstu przed usunięciem konta.
- **UX, dostępność i względy bezpieczeństwa:** Widok chroniony, modale z potwierdzeniem i focus trap, dwuetapowe potwierdzenie usunięcia konta (wpisanie hasła), jasne ostrzeżenia o skutkach (utrata dostępu, zachowanie opisów anonimowo), automatyczne wylogowanie po sukcesie, obsługa błędów Supabase (np. słabe hasło) z komunikatami aria-live.

## 3. Mapa podróży użytkownika

1. **Wejście jako gość (US-004):** Użytkownik odwiedza `/`, wypełnia formularz i uruchamia POST `/api/events`. Formularz zostaje zablokowany, pojawia się skeleton i spinner.
2. **Prezentacja wyniku:** `DescriptionPreview` pokazuje wygenerowany opis z licznikiem. Użytkownik może go skopiować (US-005) – toast potwierdzenia.
3. **Próba zapisu/oceny (US-006/US-007):** Gość klika „Zapisz” lub kciuk → otrzymuje toast „Zaloguj się…”, CTA przenosi na `/login` z informacją o docelowej akcji.
4. **Autoryzacja (US-002, US-001):** Użytkownik loguje się lub rejestruje; po sukcesie Supabase zwraca sesję, aplikacja przekierowuje na `/` i odtwarza ostatni stan, umożliwiając ponowne zapisanie zdarzenia.
5. **Zapis wydarzenia:** Zalogowany użytkownik ponownie generuje lub korzysta z cache, klika „Zapisz” → `PATCH /api/events/:id` ustawia `saved: true`, przycisk zmienia stan na „Zapisano”.
6. **Przejście do listy (US-008, US-009):** Użytkownik korzysta z nagłówka, wchodzi na `/events`. `EventList` wykonuje GET `/api/events` z filtrami (domyślne). Lista pokazuje karty z akcjami.
7. **Edycja lub usunięcie:** Użytkownik edytuje opis inline → `PATCH /api/events/:id` aktualizuje `edited_description`; modale potwierdzają usunięcie (DELETE) i blokują fokus do czasu decyzji. Toasty informują o wyniku. Infinite scroll ładuje kolejne partie po 20 elementów z fallbackiem przyciskiem.
8. **Zarządzanie kontem (US-003, US-010):** Z menu użytkownika przechodzi na `/settings`, zmienia hasło lub usuwa konto. Po usunięciu następuje wylogowanie i przekierowanie na `/login`.
9. **Scenariusze błędów:** Wygasa sesja → na próby `PATCH/DELETE` aplikacja otrzymuje 401, pokazuje toast i przekierowuje do `/login`. Długie generowanie (>10 s) pokazuje informację z opcją anulowania lub ponowienia.

## 4. Układ i struktura nawigacji

- **Nagłówek sticky:** Logo (link do `/`), główne wejścia nawigacyjne oraz sekcja użytkownika, obecny w całej aplikacji. Wysokość ~64 px z cieniowaniem dla separacji.
- **Stany nagłówka:**
  - Gość: linki `Generator`, `Zaloguj się`, przycisk CTA `Zarejestruj się`.
  - Zalogowany: linki `Generator`, `Moje wydarzenia`; menu użytkownika (avatar/ikonka) z opcjami `Ustawienia`, `Wyloguj się` (Supabase `signOut`).
- **Nawigacja mobilna:** <768 px elementy przeniesione do menu burger; panel boczny/overlay z focus trap; CTA rejestracji zachowuje wyróżnienie.
- **Aktywny stan linków:** `aria-current="page"` lub stylizowany wskaźnik. Wersja desktopowa utrzymuje 40/60 layout w generatorze, podczas gdy mobilny układa sekcje pionowo.
- **Komunikacja kontekstowa:** Toasty i banery informują o stanie sesji („Sesja wygasła”), zachęcają do zapisania po generacji oraz wskazują ograniczenia (np. 10 prób/h w przyszłości).

## 5. Kluczowe komponenty

- **`Header`** – zarządza stanem uwierzytelnienia, responsywną nawigacją, CTA rejestracji.
- **`EventForm`** – formularz z walidacją czasu rzeczywistego, licznikami znaków, obsługą błędów inline.
- **`DescriptionPreview`** – panel wynikowy ze skeletonem, licznikiem 500 znaków, tekstem "Generowanie..." podczas oczekiwania, akcjami kopiowania (ikona w prawym górnym rogu bez zmiany stanu ikon), zapisu i oceny.
- **`Toast` / `NotificationCenter`** – prezentuje komunikaty (kopiowanie, błędy API, wymóg logowania, sukces operacji) z auto-dismiss 2–3 s i aria-live polite.
- **`Modal` (Confirmation, Error, Account)** – focus trap, zamykanie klawiszem Esc, służy do potwierdzeń destrukcyjnych i komunikatów krytycznych.
- **`EventCard`** – prezentacja zapisanego wydarzenia z akcjami (Edytuj inline, Kopiuj, Usuń) oraz wskaźnikami stanu (zapisane, ocenione kciuki zablokowane po wyborze), brak dodatkowego wskaźnika oceny zgodnie z decyzją.
- **`FiltersBar` / `SortSelect` / `SearchParamsSync`** – filtry i sortowanie listy, synchronizacja z URL i React Query.
- **`InlineEditArea`** – textarea z licznikami i przyciskami Zapisz/Anuluj, obsługująca optimistic updates.
- **`InfiniteScrollObserver`** – wczytuje kolejne strony (limit 20) z fallbackiem przyciskiem „Wczytaj więcej”.
- **`AccountManagementSection`** – sekcja ustawień z kartami dla zmiany hasła i usuwania konta, integracja z Supabase.

Architektura zapewnia pokrycie wszystkich historyjek użytkownika (US-001–US-010) poprzez jednoznaczne mapowanie wymagań na widoki i komponenty, wykorzystując dostępne punkty końcowe API oraz mechanizmy Supabase Auth. Uwzględnia kluczowe punkty bólu użytkowników (czasochłonność, brak spójności, potrzeba szybkiego feedbacku) poprzez natychmiastową prezentację wyników, kopię jednym kliknięciem, klarowną walidację i mikrointerakcje zwiększające poczucie kontroli.
