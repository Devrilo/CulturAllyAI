# Diagram Podróży Użytkownika - CulturAllyAI

> Diagram przedstawiający podróż użytkownika w aplikacji CulturAllyAI, od niezalogowanego gościa do pełnego wykorzystania funkcjonalności systemu.

## Podróż użytkownika na wysokim poziomie

<mermaid_diagram>

```mermaid
stateDiagram-v2
    [*] --> StronaGlowna

    state "Strona główna (Generator)" as StronaGlowna {
        [*] --> WypelnienieFormularza
        WypelnienieFormularza --> GenerowanieOpisu
        GenerowanieOpisu --> WynikGenerowania

        state if_timeout <<choice>>
        GenerowanieOpisu --> if_timeout
        if_timeout --> KomunikatTimeout: Timeout 10s
        if_timeout --> WynikGenerowania: Sukces
        KomunikatTimeout --> WypelnienieFormularza

        state "Wyświetlenie wygenerowanego opisu" as WynikGenerowania

        state if_auth <<choice>>
        WynikGenerowania --> if_auth
        if_auth --> AkcjeGoscia: Gość
        if_auth --> AkcjeZalogowanego: Zalogowany

        state "Akcje dostępne dla gościa" as AkcjeGoscia {
            [*] --> KopiowanieOpisu
            KopiowanieOpisu --> PokazBanera
            PokazBanera --> DeklaracjaLogowania
        }

        state "Akcje zalogowanego użytkownika" as AkcjeZalogowanego {
            [*] --> WyborAkcji
            WyborAkcji --> ZapisanieWydarzenia
            WyborAkcji --> OcenaWydarzenia
            WyborAkcji --> KopiowanieOpisu2: Kopiuj
            ZapisanieWydarzenia --> PotwierdzenieZapisu
            OcenaWydarzenia --> PotwierdzenieOceny
        }
    }

    note right of StronaGlowna
        Główna funkcjonalność dostępna dla wszystkich
        Goście mogą generować i kopiować opisy
        Zalogowani mogą dodatkowo zapisywać i oceniać
    end note

    state if_decyzja_auth <<choice>>
    AkcjeGoscia --> if_decyzja_auth
    if_decyzja_auth --> ProcesRejestracji: Nowe konto
    if_decyzja_auth --> ProcesLogowania: Mam konto

    state "Proces rejestracji" as ProcesRejestracji {
        [*] --> FormularzRejestracji

        state "Formularz rejestracji" as FormularzRejestracji
        FormularzRejestracji: Email, hasło, potwierdzenie

        FormularzRejestracji --> WalidacjaRejestracji

        state if_walidacja_rej <<choice>>
        WalidacjaRejestracji --> if_walidacja_rej
        if_walidacja_rej --> KomunikatBledu1: Email istnieje
        if_walidacja_rej --> KomunikatBledu1: Hasło za słabe
        if_walidacja_rej --> TworzenieKonta: Dane poprawne
        KomunikatBledu1 --> FormularzRejestracji

        TworzenieKonta --> AutomatyczneLogowanie
        AutomatyczneLogowanie --> SesjaAktywna
    }

    note right of ProcesRejestracji
        US-001: Rejestracja użytkownika
        Walidacja: email unikalny, hasło min. 8 znaków
        Po rejestracji automatyczne logowanie
    end note

    state "Proces logowania" as ProcesLogowania {
        [*] --> FormularzLogowania

        state "Formularz logowania" as FormularzLogowania
        FormularzLogowania: Email i hasło

        FormularzLogowania --> WeryfikacjaDanych

        state if_weryfikacja <<choice>>
        WeryfikacjaDanych --> if_weryfikacja
        if_weryfikacja --> KomunikatBledu2: Nieprawidłowe dane
        if_weryfikacja --> SesjaAktywna: Dane poprawne
        KomunikatBledu2 --> FormularzLogowania
    }

    note right of ProcesLogowania
        US-002: Logowanie do systemu
        Weryfikacja przez Supabase Auth
        Redirect na stronę główną lub redirectTo
    end note

    state "Sesja aktywna" as SesjaAktywna {
        [*] --> PanelZalogowanego

        state "Panel zalogowanego użytkownika" as PanelZalogowanego

        PanelZalogowanego --> StronaGlownaZalogowany: Generuj nowe
        PanelZalogowanego --> ListaWydarzen: Moje wydarzenia
        PanelZalogowanego --> Ustawienia: Ustawienia konta
        PanelZalogowanego --> ProcesWylogowania: Wyloguj się
    }

    SesjaAktywna --> StronaGlowna: Powrót do generatora

    state "Lista zapisanych wydarzeń" as ListaWydarzen {
        [*] --> if_ochrona_events

        state if_ochrona_events <<choice>>
        if_ochrona_events --> WyswietlenieListy: Sesja aktywna
        if_ochrona_events --> RedirectLogin1: Brak sesji

        RedirectLogin1 --> ProcesLogowania

        state "Wyświetlenie listy wydarzeń" as WyswietlenieListy
        WyswietlenieListy: Chronologiczna lista
        WyswietlenieListy: Możliwość edycji i usuwania

        WyswietlenieListy --> EdycjaOpisu
        WyswietlenieListy --> UsuwanieWydarzenia
        WyswietlenieListy --> KopiowanieOpisu3: Kopiuj

        state "Edycja opisu wydarzenia" as EdycjaOpisu
        EdycjaOpisu: Limit 500 znaków
        EdycjaOpisu: Możliwość anulowania

        EdycjaOpisu --> ZapisZmian
        EdycjaOpisu --> AnulowanieZmian
        ZapisZmian --> WyswietlenieListy
        AnulowanieZmian --> WyswietlenieListy

        UsuwanieWydarzenia --> PotwierdzenieUsuniecia
        PotwierdzenieUsuniecia --> WyswietlenieListy
    }

    note right of ListaWydarzen
        US-008: Przeglądanie zapisanych opisów
        US-009: Edycja opisów wydarzeń
        Chronologiczna lista z możliwością zarządzania
    end note

    state "Ustawienia konta" as Ustawienia {
        [*] --> if_ochrona_settings

        state if_ochrona_settings <<choice>>
        if_ochrona_settings --> PanelUstawien: Sesja aktywna
        if_ochrona_settings --> RedirectLogin2: Brak sesji

        RedirectLogin2 --> ProcesLogowania

        state "Panel ustawień" as PanelUstawien

        PanelUstawien --> ZmianaHasla: Zmień hasło
        PanelUstawien --> UsuwanieKonta: Usuń konto

        state "Proces zmiany hasła" as ZmianaHasla {
            [*] --> ModalZmianyHasla
            ModalZmianyHasla: Nowe hasło + potwierdzenie
            ModalZmianyHasla: Bez wymagania obecnego hasła

            ModalZmianyHasla --> WalidacjaHasla

            state if_walidacja_hasla <<choice>>
            WalidacjaHasla --> if_walidacja_hasla
            if_walidacja_hasla --> KomunikatBledu3: Hasło za słabe
            if_walidacja_hasla --> KomunikatBledu3: Takie samo hasło
            if_walidacja_hasla --> AktualizacjaHasla: Poprawne
            KomunikatBledu3 --> ModalZmianyHasla

            AktualizacjaHasla --> WymuszoneWylogowanie
        }

        state "Proces usuwania konta" as UsuwanieKonta {
            [*] --> ModalUsunieciakonta
            ModalUsunieciakonta: Potwierdzenie hasłem
            ModalUsunieciakonta: Checkbox zgody

            ModalUsunieciakonta --> WeryfikacjaHasla

            state if_weryfikacja_hasla <<choice>>
            WeryfikacjaHasla --> if_weryfikacja_hasla
            if_weryfikacja_hasla --> KomunikatBledu4: Nieprawidłowe
            if_weryfikacja_hasla --> UsuwanieUzytkownika: Poprawne
            KomunikatBledu4 --> ModalUsunieciakonta

            UsuwanieUzytkownika --> AnonimizacjaDanych
            AnonimizacjaDanych --> WymuszoneWylogowanie2: Wyloguj
        }
    }

    note right of Ustawienia
        US-003: Zarządzanie kontem użytkownika
        Zmiana hasła: weryfikacja przez sesję JWT
        Usunięcie: anonimizacja wydarzeń (RODO)
    end note

    state "Proces wylogowania" as ProcesWylogowania {
        [*] --> ZakonczenieSesji
        ZakonczenieSesji --> CzyszczeniePamięci
        CzyszczeniePamięci --> RedirectDoLogowania
    }

    note right of ProcesWylogowania
        US-010: Bezpieczne wylogowanie
        Czyszczenie localStorage
        Redirect na /login
    end note

    WymuszoneWylogowanie --> ProcesWylogowania
    WymuszoneWylogowanie2 --> ProcesWylogowania
    ProcesWylogowania --> [*]
    RedirectDoLogowania --> [*]

    state if_sesja_wygasla <<choice>>
    ListaWydarzen --> if_sesja_wygasla: Próba akcji
    if_sesja_wygasla --> KomunikatSesjiWygaslej: 401 Unauthorized
    if_sesja_wygasla --> ListaWydarzen: Sesja OK
    KomunikatSesjiWygaslej --> ProcesLogowania

    note left of if_sesja_wygasla
        Ochrona przed nieautoryzowanym dostępem
        JWT weryfikowany przez Supabase
        Automatyczne przekierowanie do logowania
    end note
```

</mermaid_diagram>

## Wyjaśnienia diagramu

### Kluczowe ścieżki użytkownika:

**1. Ścieżka gościa (niezalogowany)**

- Dostęp do generatora bez rejestracji
- Możliwość wygenerowania i skopiowania opisu
- AuthPromptBanner zachęca do logowania
- Brak możliwości zapisania lub oceny wydarzenia

**2. Ścieżka rejestracji (US-001)**

- Formularz: email, hasło, potwierdzenie hasła
- Walidacja: unikalność email, siła hasła (min. 8 znaków)
- Automatyczne logowanie po rejestracji
- Redirect na stronę główną `/`

**3. Ścieżka logowania (US-002)**

- Formularz: email i hasło
- Weryfikacja przez Supabase Auth
- Redirect na `/` lub `redirectTo` (jeśli próbował dostać się do chronionego zasobu)
- Użytkownik pozostaje zalogowany do momentu wylogowania

**4. Ścieżka generowania (US-004)**

- Wypełnienie formularza (wszystkie pola obowiązkowe)
- Walidacja: wymagane pola, format daty, limity znaków
- Generowanie przez AI (timeout 10s)
- Wyświetlenie opisu (do 500 znaków)

**5. Ścieżka zapisywania (US-006)**

- Wymagane: użytkownik zalogowany
- Kliknięcie "Zapisz"
- Przycisk zmienia się na "Zapisane"
- Niemożność wielokrotnego zapisania

**6. Ścieżka oceny (US-007)**

- Wymagane: użytkownik zalogowany
- Kciuk w górę/dół
- Wizualne potwierdzenie oceny
- Niemożność ponownej oceny

**7. Ścieżka wydarzeń (US-008, US-009)**

- Ochrona SSR: redirect na `/login?redirect=/events` jeśli brak sesji
- Chronologiczna lista zapisanych wydarzeń
- Edycja opisu (limit 500 znaków, możliwość anulowania)
- Usuwanie wydarzeń

**8. Ścieżka zarządzania kontem (US-003)**

- Zmiana hasła: nowe hasło + potwierdzenie (bez obecnego hasła)
- Weryfikacja przez aktywną sesję JWT
- Wylogowanie po zmianie → redirect `/login`
- Usunięcie konta: potwierdzenie hasłem + checkbox
- Anonimizacja wydarzeń (ON DELETE SET NULL)

**9. Ścieżka wylogowania (US-010)**

- Przycisk "Wyloguj" w AppHeader
- Zakończenie sesji (Supabase Auth)
- Czyszczenie localStorage
- Redirect na `/login`

### Punkty decyzyjne:

- **Status autentykacji**: Gość vs Zalogowany (różne dostępne akcje)
- **Walidacja danych**: Poprawne vs Niepoprawne (kontynuacja vs komunikat błędu)
- **Timeout generowania**: Sukces vs Timeout (wynik vs komunikat błędu)
- **Ochrona tras**: Sesja aktywna vs Brak sesji (dostęp vs redirect `/login`)
- **Sesja wygasła**: 401 Unauthorized → komunikat + redirect

### Przepływy biznesowe:

1. **Od gościa do użytkownika**: Generator → Baner → Rejestracja/Logowanie → Pełny dostęp
2. **Cykl użycia generatora**: Formularz → Generuj → Wynik → Zapisz/Oceń/Kopiuj
3. **Zarządzanie wydarzeniami**: Lista → Edycja/Usuwanie → Powrót do listy
4. **Zarządzanie kontem**: Ustawienia → Zmiana hasła/Usunięcie → Wylogowanie

### Zgodność z wymaganiami:

- ✅ US-001: Rejestracja z automatycznym logowaniem
- ✅ US-002: Logowanie z przekierowaniem na stronę główną
- ✅ US-003: Zarządzanie kontem (zmiana hasła, usunięcie)
- ✅ US-004: Generowanie opisu wydarzenia
- ✅ US-005: Kopiowanie opisu do schowka
- ✅ US-006: Zapisywanie wydarzeń (tylko zalogowani)
- ✅ US-007: Ocena wydarzeń (tylko zalogowani)
- ✅ US-008: Przeglądanie zapisanych wydarzeń
- ✅ US-009: Edycja zapisanych wydarzeń
- ✅ US-010: Wylogowanie z systemu

### MVP - co NIE jest w diagramie:

- ❌ Reset hasła przez email (poza MVP)
- ❌ Potwierdzenie email po rejestracji (poza MVP)
- ❌ Onboarding użytkownika (poza MVP)
- ❌ Współdzielenie wydarzeń (poza MVP)
