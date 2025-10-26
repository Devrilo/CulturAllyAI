# Diagramy architektury autentykacji CulturAllyAI

> Diagramy ilustrujące przepływy autentykacji w aplikacji CulturAllyAI opartej na Supabase Auth.

## 1. Diagram komponentów i zależności

```mermaid
graph TB
    subgraph "Client (Browser)"
        subgraph "Astro Pages"
            LoginPage["🌐 /login<br/>login.astro"]
            RegisterPage["🌐 /register<br/>register.astro"]
            SettingsPage["🌐 /settings<br/>settings.astro<br/>(chroniony)"]
            EventsPage["🌐 /events<br/>events.astro<br/>(chroniony)"]
            GeneratorPage["🌐 /<br/>index.astro<br/>(publiczny)"]
        end
        
        subgraph "React Components - Auth"
            LoginForm["LoginForm.tsx<br/>signInWithPassword()"]
            RegisterForm["RegisterForm.tsx<br/>signUp() + signIn()"]
            AuthPageShell["AuthPageShell.tsx<br/>(wrapper)"]
            AuthErrorAlert["AuthErrorAlert.tsx<br/>(mapowanie błędów)"]
        end
        
        subgraph "React Components - Settings"
            ChangePasswordModal["ChangePasswordModal.tsx<br/>updateUser()"]
            DeleteAccountModal["DeleteAccountModal.tsx<br/>→ API endpoint"]
        end
        
        subgraph "React Components - Shared"
            AppHeader["AppHeader.tsx<br/>useSupabaseSession"]
            AuthPromptBanner["AuthPromptBanner.tsx"]
            GeneratorPageComp["GeneratorPage.tsx<br/>feature gating"]
        end
        
        subgraph "Custom Hooks"
            useSupabaseSession["useSupabaseSession<br/>onAuthStateChange()"]
            useAuthRedirect["useAuthRedirect<br/>(URLSearchParams)"]
        end
        
        subgraph "Supabase Client SDK"
            SupabaseClient["supabaseClient<br/>(ANON_KEY)"]
        end
    end
    
    subgraph "Server (Astro/Node)"
        subgraph "Middleware"
            AstroMiddleware["middleware/index.ts<br/>token z cookies → context.locals"]
        end
        
        subgraph "API Endpoints"
            AuthActivityAPI["POST /api/auth/activity<br/>(audit logs)"]
            DeleteAccountAPI["POST /api/auth/delete-account<br/>(Supabase Admin API)"]
        end
        
        subgraph "Services"
            AuthService["auth.service.ts<br/>(wrapper nad Admin API)"]
        end
        
        subgraph "Validators"
            AuthValidators["validators/auth.ts<br/>(Zod schemas)"]
        end
        
        subgraph "Supabase Admin"
            SupabaseAdmin["supabaseAdmin<br/>(SERVICE_ROLE_KEY)"]
        end
    end
    
    subgraph "Supabase Platform"
        SupabaseAuth["Supabase Auth API<br/>• signUp<br/>• signInWithPassword<br/>• signOut<br/>• updateUser<br/>• getUser (JWT verify)"]
        SupabaseDB["PostgreSQL<br/>• auth.users<br/>• user_activity_logs<br/>• events (RLS)"]
    end
    
    %% Client → Supabase direct connections
    LoginForm -->|"1. signInWithPassword()"| SupabaseClient
    RegisterForm -->|"1. signUp()<br/>2. signInWithPassword()"| SupabaseClient
    ChangePasswordModal -->|"updateUser({password})"| SupabaseClient
    AppHeader -->|"signOut()"| SupabaseClient
    GeneratorPageComp -->|"getSession()"| SupabaseClient
    
    SupabaseClient -->|"Auth API calls"| SupabaseAuth
    useSupabaseSession -->|"onAuthStateChange<br/>getSession()"| SupabaseClient
    
    %% Component relationships
    LoginPage -.->|"montuje"| LoginForm
    RegisterPage -.->|"montuje"| RegisterForm
    SettingsPage -.->|"montuje"| ChangePasswordModal
    SettingsPage -.->|"montuje"| DeleteAccountModal
    GeneratorPage -.->|"montuje"| GeneratorPageComp
    
    LoginForm -.->|"używa"| AuthPageShell
    RegisterForm -.->|"używa"| AuthPageShell
    LoginForm -.->|"używa"| AuthErrorAlert
    RegisterForm -.->|"używa"| AuthErrorAlert
    
    AppHeader -.->|"używa"| useSupabaseSession
    GeneratorPageComp -.->|"używa"| useSupabaseSession
    LoginForm -.->|"używa"| useAuthRedirect
    RegisterForm -.->|"używa"| useAuthRedirect
    
    %% SSR protection
    EventsPage -->|"getUser()"| AstroMiddleware
    SettingsPage -->|"getUser()"| AstroMiddleware
    AstroMiddleware -->|"weryfikacja JWT"| SupabaseAuth
    
    %% API calls
    DeleteAccountModal -->|"POST {password}"| DeleteAccountAPI
    LoginForm -->|"POST (audit)"| AuthActivityAPI
    RegisterForm -->|"POST (audit)"| AuthActivityAPI
    ChangePasswordModal -->|"POST (audit)"| AuthActivityAPI
    
    DeleteAccountAPI --> AuthService
    AuthActivityAPI --> AuthService
    AuthService -->|"admin.deleteUser()"| SupabaseAdmin
    AuthService -->|"signInWithPassword()<br/>(verify password)"| SupabaseAdmin
    
    SupabaseAdmin -->|"Admin API"| SupabaseAuth
    
    %% Validators
    LoginForm -.->|"validation"| AuthValidators
    RegisterForm -.->|"validation"| AuthValidators
    AuthActivityAPI -.->|"validation"| AuthValidators
    DeleteAccountAPI -.->|"validation"| AuthValidators
    
    %% Database
    SupabaseAuth -->|"CRUD<br/>auth.users"| SupabaseDB
    AuthService -->|"INSERT<br/>user_activity_logs"| SupabaseDB
    
    %% Styling
    classDef clientComponent fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef serverComponent fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef supabaseComponent fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef hookComponent fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    
    class LoginForm,RegisterForm,ChangePasswordModal,DeleteAccountModal,AppHeader,GeneratorPageComp,AuthPageShell,AuthErrorAlert,AuthPromptBanner clientComponent
    class AstroMiddleware,AuthActivityAPI,DeleteAccountAPI,AuthService,AuthValidators serverComponent
    class SupabaseClient,SupabaseAdmin,SupabaseAuth,SupabaseDB supabaseComponent
    class useSupabaseSession,useAuthRedirect hookComponent
```

## 2. Diagram sekwencji - Rejestracja i automatyczne logowanie

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Użytkownik
    participant UI as RegisterForm.tsx
    participant Validator as Zod Schema
    participant SDK as Supabase SDK<br/>(Client)
    participant Auth as Supabase Auth API
    participant DB as PostgreSQL<br/>auth.users
    participant API as POST /api/auth/activity
    participant Logs as user_activity_logs
    
    User->>UI: Wypełnia formularz<br/>(email, hasło, potwierdzenie)
    UI->>Validator: Walidacja lokalna
    Validator-->>UI: ✅ Email format OK<br/>✅ Hasło ≥8 znaków<br/>✅ Hasła zgodne
    
    UI->>SDK: signUp({ email, password })
    SDK->>Auth: POST /auth/v1/signup
    Auth->>Auth: Hash hasła (bcrypt)
    Auth->>DB: INSERT INTO auth.users
    DB-->>Auth: user_id, email
    Auth-->>SDK: { user, session: null }
    SDK-->>UI: Rejestracja OK
    
    Note over UI,SDK: Automatyczne logowanie<br/>(MVP bez email confirmation)
    
    UI->>SDK: signInWithPassword({ email, password })
    SDK->>Auth: POST /auth/v1/token?grant_type=password
    Auth->>DB: SELECT * FROM auth.users<br/>WHERE email = ?
    DB-->>Auth: user data, password_hash
    Auth->>Auth: Verify password (bcrypt)
    Auth->>Auth: Generate JWT access_token<br/>Generate refresh_token
    Auth->>DB: INSERT INTO auth.refresh_tokens
    Auth-->>SDK: { user, session: { access_token, refresh_token } }
    SDK->>SDK: Zapisz tokeny do localStorage
    SDK-->>UI: ✅ Zalogowano
    
    UI->>API: POST /api/auth/activity<br/>{ action_type: "account_created" }
    API->>Logs: INSERT (opcjonalne, nie blokuje)
    
    SDK->>SDK: onAuthStateChange → SIGNED_IN
    SDK-->>UI: Callback: nowy stan sesji
    UI->>UI: useSupabaseSession wykrywa logowanie
    UI->>User: Redirect na "/" lub redirectTo<br/>Toast: "Konto utworzone pomyślnie"
    
    Note over User,Logs: Wszystkie komponenty z useSupabaseSession<br/>automatycznie aktualizują UI (AppHeader, etc.)
```

## 3. Diagram sekwencji - Logowanie, zmiana hasła i usunięcie konta

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Użytkownik
    
    %% LOGOWANIE
    rect rgb(230, 245, 255)
        Note over User: LOGOWANIE
        participant LoginUI as LoginForm.tsx
        participant SDK as Supabase SDK
        participant Auth as Supabase Auth API
        
        User->>LoginUI: Email + Hasło
        LoginUI->>SDK: signInWithPassword({ email, password })
        SDK->>Auth: POST /auth/v1/token
        Auth->>Auth: Verify password (bcrypt)<br/>Generate JWT tokens
        Auth-->>SDK: { access_token, refresh_token }
        SDK->>SDK: localStorage.setItem()
        SDK-->>LoginUI: ✅ Session
        SDK->>SDK: onAuthStateChange → SIGNED_IN
        LoginUI->>User: Redirect + Toast
    end
    
    %% ZMIANA HASŁA
    rect rgb(255, 245, 230)
        Note over User: ZMIANA HASŁA (w /settings)
        participant SettingsUI as ChangePasswordModal.tsx
        participant API1 as POST /api/auth/activity
        
        User->>SettingsUI: Nowe hasło + Potwierdzenie
        SettingsUI->>SDK: updateUser({ password: newPassword })
        SDK->>Auth: PUT /auth/v1/user<br/>Authorization: Bearer <JWT>
        Auth->>Auth: Verify JWT (session)<br/>Hash nowe hasło (bcrypt)
        Auth->>Auth: UPDATE auth.users<br/>SET password_hash = ?
        Auth-->>SDK: ✅ User updated
        SDK-->>SettingsUI: Sukces
        
        SettingsUI->>API1: POST /api/auth/activity<br/>{ action: "password_changed" }
        
        SettingsUI->>SDK: signOut()
        SDK->>Auth: POST /auth/v1/logout
        Auth->>Auth: DELETE refresh_token
        SDK->>SDK: localStorage.clear()
        SDK->>SDK: onAuthStateChange → SIGNED_OUT
        SettingsUI->>User: Redirect /login<br/>Toast: "Zaloguj się ponownie"
    end
    
    %% USUNIĘCIE KONTA
    rect rgb(255, 235, 238)
        Note over User: USUNIĘCIE KONTA (w /settings)
        participant DeleteUI as DeleteAccountModal.tsx
        participant API2 as POST /api/auth/delete-account
        participant Service as auth.service.ts
        participant AdminSDK as Supabase Admin<br/>(SERVICE_ROLE_KEY)
        participant DB as PostgreSQL
        
        User->>DeleteUI: Hasło + Checkbox potwierdzenia
        DeleteUI->>API2: POST { password }
        
        API2->>API2: getUser() - pobranie userId
        
        Note over API2,AdminSDK: Weryfikacja hasła PRZEZ SUPABASE
        API2->>AdminSDK: signInWithPassword(email, password)
        AdminSDK->>Auth: POST /auth/v1/token
        Auth->>Auth: Verify password
        Auth-->>AdminSDK: ✅ lub ❌
        AdminSDK-->>API2: Wynik weryfikacji
        
        alt Hasło nieprawidłowe
            API2-->>DeleteUI: 401 Unauthorized
            DeleteUI->>User: Toast: "Nieprawidłowe hasło"
        else Hasło prawidłowe
            API2->>Service: logActivity("account_deleted")
            Service->>DB: INSERT user_activity_logs
            
            Note over API2,Auth: Usunięcie przez Admin API
            API2->>AdminSDK: auth.admin.deleteUser(userId)
            AdminSDK->>Auth: DELETE /auth/v1/admin/users/{id}
            Auth->>DB: DELETE FROM auth.users<br/>WHERE id = userId
            DB->>DB: ON DELETE SET NULL<br/>w tabeli events (zachowanie danych)
            Auth-->>AdminSDK: ✅ Deleted
            AdminSDK-->>API2: 200 OK
            
            API2-->>DeleteUI: 200 OK
            
            DeleteUI->>SDK: signOut()
            SDK->>SDK: localStorage.clear()
            SDK->>SDK: onAuthStateChange → SIGNED_OUT
            DeleteUI->>User: Redirect /login<br/>Toast: "Konto usunięte"
        end
    end
    
    Note over User,DB: ⚠️ KLUCZOWA ZASADA:<br/>Backend DELEGUJE weryfikację hasła i usuwanie do Supabase<br/>NIE implementuje własnej logiki auth
```

## Legendy i wyjaśnienia

### Kolory w diagramie komponentów:
- 🔵 **Niebieski** - Komponenty klienckie (React)
- 🟠 **Pomarańczowy** - Komponenty serwerowe (Astro/Node)
- 🟣 **Fioletowy** - Supabase (SDK, API, DB)
- 🟢 **Zielony** - Custom hooks

### Kluczowe punkty architektury:

1. **Single Source of Truth**: Supabase Auth zarządza całą logiką autentykacji
2. **Zero własnej implementacji**: Backend tylko deleguje do Supabase
3. **Client-side operations**: signUp, signIn, signOut, updateUser - wszystko przez SDK
4. **Server-side tylko dla Admin API**: deleteUser wymaga service role key
5. **Weryfikacja JWT**: Zawsze przez `supabase.auth.getUser()`, nigdy własna implementacja
6. **Audyt**: `user_activity_logs` zapisywane przez backend z service role key (bypass RLS)

### Przepływy sesji:

```
Rejestracja:  signUp() → signInWithPassword() → localStorage → onAuthStateChange
Logowanie:    signInWithPassword() → localStorage → onAuthStateChange  
Wylogowanie:  signOut() → localStorage.clear() → onAuthStateChange
Zmiana hasła: updateUser() → signOut() (wymuś ponowne logowanie)
Usunięcie:    Backend verify password → admin.deleteUser() → signOut()
```

### Ochrona tras:

```typescript
// SSR Protection (Astro)
const { data: { user }, error } = await context.locals.supabase.auth.getUser();
if (!user || error) return Astro.redirect('/login?redirect=...');

// Client-side Protection (React)
const { isAuthenticated } = useSupabaseSession(supabase);
if (!isAuthenticated) return <AuthPromptBanner />;
```
