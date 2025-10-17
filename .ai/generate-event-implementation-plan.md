# API Endpoint Implementation Plan: POST /api/events

WAŻNE:
Na etapie developmentu skorzystamy z mocków zamiast wywoływania serwisu AI.

## 1. Przegląd punktu końcowego
- Tworzy rekord wydarzenia w `events` z opisem wygenerowanym przez usługę AI oraz flagą źródła użytkownika.
- Obsługuje zarówno użytkowników zalogowanych (powiązanie `user_id`) jak i gości (brak `user_id`).
- Zachowuje metadane generacji (`model_version`, znaczniki czasu) i rejestruje akcję w `event_management_logs` jako `event_created`.
- Zwraca pełny obiekt wydarzenia (`EventResponseDTO`) wraz z danymi generacji dla dalszej prezentacji w UI.

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- Ścieżka: `/api/events`
- Nagłówki: `Content-Type: application/json`; opcjonalnie `Authorization: Bearer <jwt>`
- Parametry:
  - Wymagane: body zgodne z `CreateEventDTO` (`title`, `city`, `event_date`, `category`, `age_category`, `key_information`).
  - Opcjonalne: brak dodatkowych parametrów HTTP; token Bearer tylko dla użytkowników zalogowanych.
- Walidacja treści:
  - Schemat Zod (`src/lib/validators/events.ts`) wymuszający długości (100/50/200 znaków), poprawny ISO date ≥ bieżąca data (UTC) i wartości enum zgodne z Supabase.
  - Od razu odrzuca pusty lub nadmiarowy payload kodem 400 z `ErrorResponseDTO`.

## 3. Szczegóły odpowiedzi
- Sukces 201: pełny obiekt `EventResponseDTO` w JSON z polami bazy (`id`, `user_id`, `created_by_authenticated_user`, `generated_description`, `model_version`, `created_at`, `updated_at`, itd.).
- Błędy 400/401/500/503: struktura `ErrorResponseDTO` z polami `error`, `message`, opcjonalnie `details` (lista `ValidationErrorDTO`).
- Nagłówki odpowiedzi: `Content-Type: application/json`; rozważ `Retry-After` dla błędów 503.
- Standaryzacja: wszystkie daty w ISO 8601 (UTC), `id` jako UUID v4, brak pól null gdy niepotrzebne (użyć `null` tylko dla `user_id`, `edited_description`, `feedback`).

## 4. Przepływ danych
- API route (`src/pages/api/events/index.ts`) pobiera `locals.supabase` i identyfikator użytkownika z tokenu (jeśli obecny).
- Waliduje body, buduje `CreateEventCommand` (wewnętrzny typ) i przekazuje do `createEvent` w `src/lib/services/events.service.ts`.
- Serwis wywołuje `generateEventDescription` (np. `src/lib/services/ai/generate-event-description.ts`) z gotowym promptem i limitami znaków; obsługuje timeout poprzez `AbortController`.
- Po uzyskaniu tekstu serwis przygotowuje `TablesInsert<'events'>`, uzupełnia `created_by_authenticated_user`, `model_version` (z `import.meta.env.AI_MODEL_VERSION`), `saved=false`, `feedback=null`, `edited_description=null` i zapisuje rekord przez Supabase.
- Po sukcesie tworzy wpis w `event_management_logs` (`CreateEventManagementLogDTO`) z `action_type='event_created'`, `user_id` (jeśli dostępny) oraz `event_id`.
- Zwraca pełen rekord zdublowany w API response; API mapuje go 1:1 do DTO i ustawia status 201.

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: ekstrakcja JWT Supabase z nagłówka; przy błędnym tokenie zwrócić 401 i potraktować żądanie jako nieautoryzowane.
- Autoryzacja: jeśli brak użytkownika → wymusić `user_id=null`, `created_by_authenticated_user=false`; dla zalogowanych ustawiać `created_by_authenticated_user=true` i przekazać `user_id`.
- Zgodność z RLS: INSERT musi zawierać `user_id = auth.uid()` dla użytkowników, aby przejść regułę "Users can create events"; goście bez `user_id` są dopuszczani przez oddzielną politykę (upewnić się, że istnieje lub zaplanować modyfikację).
- Ochrona sekretów: klucz OpenRouter i nazwa modelu przechowywać w `import.meta.env`; nie logować danych poufnych.
- Rate limiting (np. middleware w `src/middleware/index.ts`): osobne limity dla IP i `user_id` aby zabezpieczyć zasób AI przed nadużyciem.

## 6. Obsługa błędów
- `400 Bad Request`: naruszenie walidacji Zod (zwrócić listę pól), data w przeszłości, błędny enum, opis AI pusty po przycięciu (fallback).
- `401 Unauthorized`: token obecny lecz odrzucony przez Supabase (`getUser` zwraca błąd) lub brak możliwości utworzenia w RLS przy deklarowanej autoryzacji.
- `500 Internal Server Error`: błąd komunikacji z Supabase lub nieprzewidziany wyjątek w serwisie AI (np. JSON parse, brak pola).
- `503 Service Unavailable`: timeout lub explicit `429/503` z OpenRouter; ustawić `Retry-After` gdy dostępny.
- Logowanie błędów: strukturalne logi (np. `console.error` podpięte do Logflare/Sentry) z korelacją `requestId`; rozważyć tabelę `error_logs` przyszłościowo.

## 7. Wydajność
- Timeout AI: limit 30s na generację, fallback do własnego komunikatu błędu 503.
- Równoległe operacje: generacja AI i przygotowanie danych wejściowych wykonywać sekwencyjnie, wstawienie do Supabase w jednym żądaniu.
- Minimalizacja wielkości odpowiedzi: zwracać pojedynczy rekord (brak zbędnych list) i przycinać opis do 500 znaków przed zapisem.
- Indeksy w `events` już istnieją; korzystać z `RETURNING` aby uniknąć dodatkowego `SELECT`.
- Cache promptów: brak (dane unikalne); ewentualnie obudować usługę AI warstwą circuit breaker by ograniczyć kolejne próby po 503.

## 8. Kroki implementacji
1. Dodać schemat walidacji Zod w `src/lib/validators/events.ts` wraz z testami jednostkowymi (np. Vitest) obejmującymi limity znaków i walidację daty.
2. Utworzyć/rozszerzyć `src/lib/services/ai/generate-event-description.ts` o funkcję generującą opis z OpenRouter (kontrola timeoutu, przycinanie, obsługa 5xx/timeout → rzuca dedykowany błąd).
3. Utworzyć `src/lib/services/events.service.ts` z funkcją `createEvent(command: CreateEventCommand)` integrującą walidację, AI i zapis do Supabase + log w `event_management_logs`.
4. Zaimplementować endpoint w `src/pages/api/events/index.ts`: pobrać użytkownika z `locals.supabase`, wywołać walidację i serwis, zwrócić status 201; dodać mapowanie błędów na kody statusu (400/401/500/503).
5. Uzupełnić testy integracyjne (np. Playwright API lub Vitest z msw) symulujące przypadki: gość, użytkownik, walidacja 400, błąd AI 503, błąd Supabase 500.
6. Zweryfikować konfigurację RLS dla gości (jeśli brak polityki INSERT bez `user_id`, dodać ją w migracji) oraz dodać wpis `event_created` do logów.
7. Dodać dokumentację w `docs`/`README` (sekcja API) i zaktualizować changelog; zweryfikować pipeline CI (lint + testy) przed wdrożeniem.
8. Przeprowadzić testy ręczne w środowisku dev: generacja jako gość i zalogowany, obserwacja logów, czasu odpowiedzi i nagłówków rate limit.
