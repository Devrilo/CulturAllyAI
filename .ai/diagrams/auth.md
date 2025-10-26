# Diagram Autentykacji CulturAllyAI

> Kompleksowy diagram sekwencji przedstawiający przepływ autentykacji w aplikacji CulturAllyAI opartej na Supabase Auth, Astro 5 i React 19.

## Pełny cykl życia autentykacji

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber
    
    participant Przeglądarka
    participant ReactForm as React Form<br/>(LoginForm)
    participant SupabaseSDK as Supabase SDK<br/>(Client)
    participant Middleware as Astro Middleware
    participant AstroAPI as Astro API<br/>(Endpoints)
    participant SupabaseAuth as Supabase Auth<br/>(API)
    participant DB as PostgreSQL<br/>(auth.users)
    
    Note over Przeglądarka,DB: PRZEPŁYW 1: LOGOWANIE
    
    Przeglądarka->>ReactForm: Użytkownik wypełnia<br/>email i hasło
    activate ReactForm
    ReactForm->>ReactForm: Walidacja lokalna<br/>(Zod schema)
    ReactForm->>SupabaseSDK: signInWithPassword()
    activate SupabaseSDK
    SupabaseSDK->>SupabaseAuth: POST /auth/v1/token
    activate SupabaseAuth
    SupabaseAuth->>DB: SELECT * WHERE email
    DB-->>SupabaseAuth: user data + password_hash
    SupabaseAuth->>SupabaseAuth: Weryfikacja hasła<br/>(bcrypt compare)
    
    alt Hasło prawidłowe
        SupabaseAuth->>SupabaseAuth: Generuj JWT tokens<br/>(access + refresh)
        SupabaseAuth->>DB: INSERT refresh_token
        SupabaseAuth-->>SupabaseSDK: 200 OK<br/>access_token, refresh_token
        deactivate SupabaseAuth
        SupabaseSDK->>SupabaseSDK: localStorage.setItem()<br/>(zapisz tokeny)
        SupabaseSDK->>SupabaseSDK: onAuthStateChange<br/>(SIGNED_IN)
        SupabaseSDK-->>ReactForm: session OK
        deactivate SupabaseSDK
        ReactForm->>AstroAPI: POST /api/auth/activity<br/>(login audit)
        ReactForm->>Przeglądarka: Redirect na /<br/>Toast: Zalogowano
        deactivate ReactForm
    else Hasło nieprawidłowe
        SupabaseAuth-->>SupabaseSDK: 400 Invalid credentials
        deactivate SupabaseAuth
        SupabaseSDK-->>ReactForm: AuthError
        deactivate SupabaseSDK
        ReactForm->>Przeglądarka: Alert: Nieprawidłowy<br/>email lub hasło
        deactivate ReactForm
    end
    
    Note over Przeglądarka,DB: PRZEPŁYW 2: DOSTĘP DO CHRONIONEGO ZASOBU
    
    Przeglądarka->>Middleware: GET /api/events/123<br/>Header: Authorization Bearer token
    activate Middleware
    Middleware->>Middleware: Odczyt tokenu<br/>z Authorization header
    Middleware->>Middleware: Utwórz Supabase Client<br/>z tokenem użytkownika
    Middleware->>Middleware: Inject do context.locals
    Middleware->>AstroAPI: Przekaż żądanie<br/>z locals.supabase
    deactivate Middleware
    activate AstroAPI
    AstroAPI->>SupabaseSDK: locals.supabase<br/>.auth.getUser()
    activate SupabaseSDK
    SupabaseSDK->>SupabaseAuth: Weryfikuj JWT
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Dekoduj token<br/>Sprawdź sygnaturę<br/>Sprawdź expiry
    
    alt Token ważny
        SupabaseAuth->>DB: SELECT * WHERE id
        DB-->>SupabaseAuth: user data
        SupabaseAuth-->>SupabaseSDK: user OK
        deactivate SupabaseAuth
        SupabaseSDK-->>AstroAPI: user object
        deactivate SupabaseSDK
        AstroAPI->>DB: SELECT event<br/>WHERE id AND user_id
        DB-->>AstroAPI: event data
        AstroAPI-->>Przeglądarka: 200 OK<br/>EventResponseDTO
        deactivate AstroAPI
    else Token wygasły lub nieprawidłowy
        SupabaseAuth-->>SupabaseSDK: 401 jwt_expired
        deactivate SupabaseAuth
        SupabaseSDK-->>AstroAPI: error: jwt_expired
        deactivate SupabaseSDK
        AstroAPI-->>Przeglądarka: 401 Unauthorized
        deactivate AstroAPI
        Przeglądarka->>Przeglądarka: Toast: Sesja wygasła
        Przeglądarka->>Przeglądarka: Redirect /login
    end
    
    Note over Przeglądarka,DB: PRZEPŁYW 3: AUTOMATYCZNE ODŚWIEŻANIE TOKENU
    
    Przeglądarka->>SupabaseSDK: Akcja użytkownika<br/>(np. klik Zapisz)
    activate SupabaseSDK
    SupabaseSDK->>SupabaseSDK: Sprawdź expiry<br/>access_token
    SupabaseSDK->>SupabaseSDK: Token wygasł!<br/>Użyj refresh_token
    SupabaseSDK->>SupabaseAuth: POST /auth/v1/token<br/>grant_type=refresh_token
    activate SupabaseAuth
    SupabaseAuth->>DB: SELECT refresh_token<br/>WHERE token
    DB-->>SupabaseAuth: token valid
    SupabaseAuth->>SupabaseAuth: Generuj nowy<br/>access_token
    SupabaseAuth->>DB: UPDATE refresh_token<br/>(rotation)
    SupabaseAuth-->>SupabaseSDK: 200 OK<br/>nowy access_token
    deactivate SupabaseAuth
    SupabaseSDK->>SupabaseSDK: localStorage.setItem()<br/>(zaktualizuj token)
    SupabaseSDK->>SupabaseSDK: onAuthStateChange<br/>(TOKEN_REFRESHED)
    SupabaseSDK-->>Przeglądarka: Kontynuuj akcję<br/>z nowym tokenem
    deactivate SupabaseSDK
    
    Note over Przeglądarka,DB: PRZEPŁYW 4: WYLOGOWANIE
    
    Przeglądarka->>SupabaseSDK: Klik Wyloguj
    activate SupabaseSDK
    SupabaseSDK->>AstroAPI: POST /api/auth/activity<br/>(logout audit)
    SupabaseSDK->>SupabaseAuth: POST /auth/v1/logout
    activate SupabaseAuth
    SupabaseAuth->>DB: DELETE refresh_token<br/>WHERE user_id
    SupabaseAuth-->>SupabaseSDK: 204 No Content
    deactivate SupabaseAuth
    SupabaseSDK->>SupabaseSDK: localStorage.clear()<br/>(usuń tokeny)
    SupabaseSDK->>SupabaseSDK: onAuthStateChange<br/>(SIGNED_OUT)
    SupabaseSDK-->>Przeglądarka: Wylogowano
    deactivate SupabaseSDK
    Przeglądarka->>Przeglądarka: Redirect /login<br/>Toast: Wylogowano pomyślnie
    
    Note over Przeglądarka,DB: PRZEPŁYW 5: REJESTRACJA Z AUTO-LOGOWANIEM
    
    Przeglądarka->>ReactForm: Wypełnia formularz<br/>rejestracji
    activate ReactForm
    ReactForm->>ReactForm: Walidacja Zod<br/>(email, hasło, zgodność)
    ReactForm->>SupabaseSDK: signUp(email, password)
    activate SupabaseSDK
    SupabaseSDK->>SupabaseAuth: POST /auth/v1/signup
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Hash hasła (bcrypt)
    SupabaseAuth->>DB: INSERT INTO auth.users
    DB-->>SupabaseAuth: user_id
    SupabaseAuth-->>SupabaseSDK: user created<br/>(bez session)
    deactivate SupabaseAuth
    
    Note over ReactForm,SupabaseSDK: MVP bez email confirmation<br/>Auto-logowanie
    
    ReactForm->>SupabaseSDK: signInWithPassword()<br/>(automatyczne)
    SupabaseSDK->>SupabaseAuth: POST /auth/v1/token
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Generuj tokeny
    SupabaseAuth-->>SupabaseSDK: access + refresh token
    deactivate SupabaseAuth
    SupabaseSDK->>SupabaseSDK: localStorage.setItem()
    SupabaseSDK-->>ReactForm: session OK
    deactivate SupabaseSDK
    ReactForm->>AstroAPI: POST /api/auth/activity<br/>(account_created)
    ReactForm->>Przeglądarka: Redirect na /<br/>Toast: Konto utworzone
    deactivate ReactForm
```

</mermaid_diagram>

## Wyjaśnienia diagramu

### Kluczowe elementy architektury:

1. **Supabase jako Single Source of Truth**
   - Wszystkie operacje auth delegowane do Supabase Auth API
   - Backend nie implementuje własnej logiki weryfikacji
   - JWT weryfikowane przez Supabase (sygnatura, expiry)

2. **Middleware jakomost między klientem a API**
   - Odczyt tokenu z header `Authorization`
   - Utworzenie klienta Supabase z tokenem użytkownika
   - Inject do `context.locals.supabase`

3. **Automatyczne odświeżanie tokenów**
   - Supabase SDK wykrywa wygasły access_token (TTL ~1h)
   - Automatyczne użycie refresh_token
   - Rotation refresh_token dla bezpieczeństwa
   - `onAuthStateChange` informuje komponenty o nowej sesji

4. **Ochrona przed nieautoryzowanym dostępem**
   - Chronione endpointy wywołują `supabase.auth.getUser()`
   - Weryfikacja JWT przez Supabase
   - 401 Unauthorized przy błędzie → redirect na `/login`
   - RLS policies w PostgreSQL używają `auth.uid()`

5. **Przepływ sesji po zalogowaniu**
   - Tokeny zapisane w localStorage przez Supabase SDK
   - `onAuthStateChange` monitoruje zmiany sesji
   - Hook `useSupabaseSession` dostarcza stan do komponentów
   - `AppHeader` reaguje na zmiany i aktualizuje UI

### Obsługa błędów:

- **Invalid credentials**: Alert w formularzu, nie blokuje UI
- **JWT expired**: Automatyczne odświeżanie lub redirect na `/login`
- **Network error**: Toast z komunikatem, możliwość ponowienia
- **Rate limit (429)**: Supabase automatycznie blokuje, komunikat użytkownikowi

### Bezpieczeństwo:

- Hasła hashowane przez Supabase (bcrypt)
- JWT podpisane kluczem Supabase (weryfikacja sygnatury)
- Refresh token rotation (zmiana przy każdym użyciu)
- Tokeny NIE trafiają do logów (tylko error.code)
- RLS policies w bazie danych (auth.uid())
