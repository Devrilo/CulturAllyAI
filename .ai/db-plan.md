# Schemat bazy danych PostgreSQL - CulturAllyAI

## 1. Tabele z kolumnami, typami danych i ograniczeniami

### 1.1 Typy ENUM

```sql
-- Kategorie wydarzeń kulturalnych
CREATE TYPE event_category AS ENUM (
  'koncerty',
  'imprezy',
  'teatr_i_taniec',
  'sztuka_i_wystawy',
  'literatura',
  'kino',
  'festiwale',
  'inne'
);

-- Kategorie wiekowe
CREATE TYPE age_category AS ENUM (
  'wszystkie',
  'najmlodsi',
  'dzieci',
  'nastolatkowie',
  'mlodzi_dorosli',
  'dorosli',
  'osoby_starsze'
);

-- Typy akcji użytkownika
CREATE TYPE user_action_type AS ENUM (
  'account_created',
  'account_deleted',
  'password_changed',
  'login',
  'logout'
);

-- Typy akcji zarządzania wydarzeniami
CREATE TYPE event_action_type AS ENUM (
  'event_created',
  'event_saved',
  'event_edited',
  'event_deleted',
  'event_rated'
);

-- Typy ocen generacji
CREATE TYPE feedback AS ENUM (
  'thumbs_up',
  'thumbs_down'
);
```

### 1.2 Tabela: users

**Uwaga:** Tabela `auth.users` jest zarządzana przez Supabase Auth. Nie tworzymy jej ręcznie - Supabase automatycznie obsługuje autentykację, rejestrację i zarządzanie użytkownikami.

### 1.3 Tabela: events

Główna tabela przechowująca wszystkie wygenerowane wydarzenia.

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Flaga określająca czy wydarzenie zostało utworzone przez zalogowanego użytkownika
  created_by_authenticated_user BOOLEAN NOT NULL DEFAULT false,
  
  -- Dane wejściowe użytkownika
  title VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  event_date DATE NOT NULL,
  category event_category NOT NULL,
  age_category age_category NOT NULL,
  key_information TEXT NOT NULL CHECK (char_length(key_information) <= 200),
  
  -- Wygenerowany opis przez AI (niezmienialny)
  generated_description TEXT NOT NULL CHECK (char_length(generated_description) <= 500),
  
  -- Edytowalny opis (opcjonalny, NULL jeśli użytkownik nie edytował)
  edited_description TEXT CHECK (char_length(edited_description) <= 500),
  
  -- Czy wydarzenie zostało zapisane przez użytkownika
  saved BOOLEAN NOT NULL DEFAULT false,
  
  -- Opcjonalna ocena wygenerowanego opisu
  feedback feedback,
  
  -- Metadane
  model_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_event_date CHECK (event_date >= CURRENT_DATE),
  
  -- Ograniczenia dla wydarzeń niezalogowanych użytkowników
  CONSTRAINT guest_events_cannot_be_saved CHECK (created_by_authenticated_user = true OR saved = false),
  CONSTRAINT guest_events_cannot_have_feedback CHECK (created_by_authenticated_user = true OR feedback IS NULL),
  CONSTRAINT guest_events_cannot_be_edited CHECK (created_by_authenticated_user = true OR edited_description IS NULL),
  
  -- Spójność: jeśli user_id nie jest NULL, to musi być created_by_authenticated_user = true
  CONSTRAINT authenticated_user_consistency CHECK (user_id IS NULL OR created_by_authenticated_user = true)
);
```

### 1.4 Tabela: user_activity_logs

Loguje akcje związane z zarządzaniem kontem użytkownika.

```sql
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type user_action_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.5 Tabela: event_management_logs

Loguje akcje związane z zarządzaniem wydarzeniami.

```sql
CREATE TABLE event_management_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  action_type event_action_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 2. Relacje między tabelami

### 2.1 Relacje jeden-do-wielu

- **auth.users → events**: Jeden użytkownik może utworzyć wiele wydarzeń (opcjonalne - wydarzenia mogą być tworzone przez niezalogowanych użytkowników)
  - Klucz obcy: `events.user_id` → `auth.users.id`
  - Ustawienie NULL przy usunięciu: `ON DELETE SET NULL` (usunięcie użytkownika zachowuje wydarzenia, ale ustawia `user_id = NULL`)
  - `user_id` może być `NULL` dla:
    - Wydarzeń generowanych przez niezalogowanych użytkowników
    - Wydarzeń, których właściciel usunął konto

- **auth.users → user_activity_logs**: Jeden użytkownik może mieć wiele logów aktywności
  - Klucz obcy: `user_activity_logs.user_id` → `auth.users.id`
  - Ustawienie NULL przy usunięciu: `ON DELETE SET NULL`

- **auth.users → event_management_logs**: Jeden użytkownik może mieć wiele logów zarządzania wydarzeniami
  - Klucz obcy: `event_management_logs.user_id` → `auth.users.id`
  - Ustawienie NULL przy usunięciu: `ON DELETE SET NULL`

- **events → event_management_logs**: Jedno wydarzenie może mieć wiele logów zarządzania
  - Klucz obcy: `event_management_logs.event_id` → `events.id`
  - Ustawienie NULL przy usunięciu: `ON DELETE SET NULL`

## 3. Indeksy

```sql
-- Indeksy dla tabeli events
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_saved ON events(saved);
CREATE INDEX idx_events_created_by_authenticated_user ON events(created_by_authenticated_user);

-- Indeksy dla tabeli user_activity_logs
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action_type ON user_activity_logs(action_type);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- Indeksy dla tabeli event_management_logs
CREATE INDEX idx_event_management_logs_user_id ON event_management_logs(user_id);
CREATE INDEX idx_event_management_logs_event_id ON event_management_logs(event_id);
CREATE INDEX idx_event_management_logs_action_type ON event_management_logs(action_type);
CREATE INDEX idx_event_management_logs_created_at ON event_management_logs(created_at DESC);
```

## 4. Funkcje i triggery

### 4.1 Funkcja automatycznej aktualizacji updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Trigger dla tabeli events

```sql
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 5. Zasady Row Level Security (RLS)

### 5.1 Włączenie RLS dla tabel

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

### 5.2 Zasady RLS dla tabeli events

```sql
-- Użytkownik może przeglądać tylko własne wydarzenia
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

-- Użytkownik może tworzyć wydarzenia
CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Użytkownik może aktualizować tylko własne wydarzenia
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Użytkownik może usuwać tylko własne wydarzenia
CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);
```

## 6. Dodatkowe uwagi i wyjaśnienia decyzji projektowych

### 6.1 Typy ENUM

Zastosowano typy ENUM dla kategorialnych danych (kategorie wydarzeń, kategorie wiekowe, typy akcji) w celu:
- Zapewnienia integralności danych na poziomie bazy
- Zwiększenia czytelności schematu
- Ograniczenia możliwych wartości do predefiniowanych opcji

### 6.2 Separacja opisów i zarządzanie stanem wydarzenia

Tabela `events` zawiera:
- **Dwa typy opisów**:
  - `generated_description`: Oryginalny opis wygenerowany przez AI (niezmienialny, zawsze przechowywany)
  - `edited_description`: Opis edytowany przez użytkownika (opcjonalny, NULL jeśli użytkownik nie edytował)
  
- **Pole `user_id`**: UUID (nullable) identyfikujący użytkownika
  - `NULL` = użytkownik nie jest przypisany (gość lub usunięte konto)
  - UUID = wydarzenie ma przypisanego aktywnego użytkownika
  - W połączeniu z `created_by_authenticated_user` daje pełny obraz źródła wydarzenia

- **Pole `created_by_authenticated_user`**: Boolean określający źródło utworzenia wydarzenia
  - `false` = wydarzenie utworzone przez **gościa** (niezalogowanego użytkownika)
    - `user_id` zawsze `NULL`
    - Nie może mieć `saved = true`, `feedback`, ani `edited_description`
  - `true` = wydarzenie utworzone przez **zalogowanego użytkownika**
    - `user_id` może być UUID (użytkownik aktywny) lub `NULL` (użytkownik usunął konto)
    - Może mieć zapisane wartości `saved`, `feedback`, `edited_description` (zachowane po usunięciu konta)
  
- **Pole `saved`**: Boolean określający czy użytkownik "zapisał" wydarzenie (domyślnie `false`)
  - Wydarzenia niezapisane (`saved = false`) pozostają w bazie dla celów historycznych i analitycznych
  - Użytkownik może w każdej chwili zmienić status zapisu
  - **Soft delete**: Usunięcie wydarzenia przez użytkownika ustawia `saved = false`, ale nie usuwa fizycznie rekordu z bazy
  - **Ograniczenie**: Niezalogowani użytkownicy (`user_id IS NULL`) nie mogą mieć `saved = true`
  
- **Pole `feedback`**: Opcjonalna ocena (thumbs_up/thumbs_down)
  - Użytkownik może ocenić wygenerowany opis w interfejsie generowania
  - Każde wydarzenie może mieć maksymalnie jedną ocenę
  - **Ograniczenie**: Niezalogowani użytkownicy (`user_id IS NULL`) nie mogą oceniać (feedback musi być NULL)

To rozwiązanie pozwala na:
- Generowanie opisów przez niezalogowanych użytkowników (gości) bez możliwości zapisywania/edycji/oceny
- Zachowanie oryginalnej wersji dla celów analitycznych
- Możliwość przywrócenia oryginalnego opisu (użytkownik może usunąć `edited_description`)
- Porównanie jakości generacji AI z ręcznymi edycjami
- Pełną historię wszystkich wygenerowanych wydarzeń (również niezapisanych i "usuniętych")
- Prostą analizę skuteczności AI poprzez agregację pola `feedback`
- **Rozróżnienie między gośćmi a usuniętymi kontami** dzięki polu `created_by_authenticated_user`

### 6.3 Strategia usuwania (SET NULL dla zachowania danych)

**Wszystkie tabele używają `ON DELETE SET NULL`** aby zachować dane historyczne i analityczne:

- **auth.users → events** (`ON DELETE SET NULL`):
  - Gdy użytkownik usuwa konto, jego wydarzenia **pozostają w bazie**
  - Kolumna `user_id` jest ustawiana na `NULL`
  - Zachowujemy pełną historię wszystkich wygenerowanych opisów dla celów analitycznych
  - Po usunięciu konta użytkownika, jego wydarzenia stają się "anonimowe" (jak wydarzenia gości)
  - **NIGDY nie usuwamy rekordów z tabeli `events`**

- **auth.users → user_activity_logs** i **auth.users → event_management_logs** (`ON DELETE SET NULL`):
  - Logi pozostają w bazie dla celów analitycznych i audytowych
  - Tracą bezpośrednie powiązanie z usuniętym użytkownikiem (`user_id = NULL`)
  - Zachowujemy pełną historię akcji w systemie

- **events → event_management_logs** (`ON DELETE SET NULL`):
  - Teoretycznie wydarzenia nie powinny być fizycznie usuwane
  - Jeśli jednak dojdzie do usunięcia (np. przez admina), logi pozostają z `event_id = NULL`

### 6.4 Ograniczenia walidacyjne

Zaimplementowano ograniczenia CHECK dla:
- Limitów znaków (200 dla key_information, 500 dla opisów)
- Walidacji daty wydarzenia (nie może być w przeszłości)

### 6.5 Indeksowanie

Indeksy zostały dodane dla:
- Kluczy obcych (optymalizacja JOIN)
- Kolumn często używanych w klauzulach WHERE (user_id, event_date, category, saved, created_by_authenticated_user)
- Kolumn używanych do sortowania (created_at DESC)

Indeksy na kolumnach `saved` i `created_by_authenticated_user` zostały dodane, ponieważ będą często używane do:
- Filtrowania wydarzeń zapisanych przez użytkownika
- Analiz rozróżniających wydarzenia gości od wydarzeń zalogowanych użytkowników

### 6.6 Bezpieczeństwo na poziomie wierszy (RLS)

Zasady RLS zapewniają:
- Izolację danych użytkowników w tabeli `events` (każdy użytkownik widzi tylko swoje wydarzenia)
- Zgodność z zasadą najmniejszych uprawnień
- Tabele logów (`user_activity_logs`, `event_management_logs`) nie mają włączonego RLS, co umożliwia dostęp z poziomu bazy danych dla celów analitycznych i audytowych

### 6.7 Audytowalność

Wszystkie kluczowe akcje są logowane w dedykowanych tabelach:
- `user_activity_logs`: Akcje związane z kontem użytkownika (rejestracja, logowanie, zmiana hasła, usunięcie konta)
- `event_management_logs`: Akcje związane z zarządzaniem wydarzeniami (tworzenie, zapisywanie, edycja, "usuwanie")
  - Kolumna `user_id` jest nullable, co umożliwia logowanie akcji niezalogowanych użytkowników
  - `event_created` z `user_id = NULL` oznacza generację przez niezalogowanego użytkownika

Oceny AI są przechowywane bezpośrednio w tabeli `events` w kolumnie `feedback`, co umożliwia:
- Monitorowanie aktywności użytkowników (zalogowanych i niezalogowanych)
- Analizę skuteczności AI poprzez proste zapytania agregujące
- Zgodność z wymaganiami audytowymi
- Łatwy dostęp do ocen bez konieczności JOIN z dodatkową tabelą

### 6.8 Normalizacja

Schemat jest znormalizowany do 3NF, co zapewnia:
- Eliminację redundancji danych
- Łatwość utrzymania i aktualizacji
- Integralność danych

### 6.9 Skalowalność

Projekt uwzględnia przyszłą skalowalność poprzez:
- Użycie UUID jako kluczy głównych (rozproszenie danych)
- Odpowiednie indeksowanie
- Optymalne strategie usuwania kaskadowego
- Separację danych operacyjnych od analitycznych (tabele logów)

### 6.10 Integracja z Supabase Auth

Schemat wykorzystuje wbudowaną tabelę `auth.users` z Supabase, co zapewnia:
- Bezproblemową integrację z systemem autentykacji
- Zgodność z najlepszymi praktykami Supabase
- Automatyczne zarządzanie sesjami i tokenami JWT
