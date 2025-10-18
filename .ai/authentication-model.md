# Authentication Model - CulturAllyAI

## Podsumowanie

CulturAllyAI wykorzystuje **Supabase Auth** jako wyłączny system autoryzacji i autentykacji użytkowników. Wszystkie operacje związane z zarządzaniem użytkownikami są obsługiwane **po stronie klienta** (client-side) za pomocą Supabase JavaScript SDK.

## Model Autoryzacji

### Client-Side (Frontend)

**Odpowiedzialność:**
- Rejestracja użytkowników
- Logowanie/wylogowanie
- Zmiana hasła
- Usuwanie konta
- Zarządzanie sesją
- Automatyczne odświeżanie tokenów

**Implementacja:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Rejestracja
await supabase.auth.signUp({ email, password })

// Logowanie
await supabase.auth.signInWithPassword({ email, password })

// Wylogowanie
await supabase.auth.signOut()

// Zmiana hasła
await supabase.auth.updateUser({ password: newPassword })
```

### Backend (API Routes)

**Odpowiedzialność:**
- **Wyłącznie weryfikacja** tokenów JWT wystawionych przez Supabase Auth
- Ekstrakcja `user_id` z zweryfikowanego tokenu
- Zastosowanie polityk RLS (Row Level Security)

**Implementacja:**
```typescript
// src/pages/api/events/index.ts
const supabase = context.locals.supabase;
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  // Return 401 Unauthorized
}
// Użyj user.id do operacji na bazie danych
```

## Dlaczego NIE ma własnych endpointów `/api/auth/*`?

1. **Duplikacja funkcjonalności** - Supabase Auth już zapewnia wszystkie potrzebne operacje
2. **Bezpieczeństwo** - Supabase Auth jest battle-tested i regularnie aktualizowany
3. **Mniej kodu do utrzymania** - Nie trzeba implementować własnej logiki JWT
4. **Spójność** - Wykorzystanie jednego systemu uwierzytelniania
5. **Automatyczne funkcje** - Odświeżanie tokenów, sesje, rate limiting są wbudowane

## Przepływ Autoryzacji

### Dla Użytkowników Zalogowanych

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Frontend  │          │  Supabase   │          │   Backend   │
│             │          │    Auth     │          │     API     │
└──────┬──────┘          └──────┬──────┘          └──────┬──────┘
       │                        │                        │
       │  signInWithPassword    │                        │
       │───────────────────────>│                        │
       │                        │                        │
       │  {user, session}       │                        │
       │<───────────────────────│                        │
       │                        │                        │
       │  POST /api/events      │                        │
       │  Authorization: Bearer <jwt>                    │
       │────────────────────────────────────────────────>│
       │                        │                        │
       │                        │  getUser(jwt)          │
       │                        │<───────────────────────│
       │                        │                        │
       │                        │  {user}                │
       │                        │───────────────────────>│
       │                        │                        │
       │  201 Created                                    │
       │<────────────────────────────────────────────────│
```

### Dla Gości (bez autoryzacji)

```
┌─────────────┐                                   ┌─────────────┐
│   Frontend  │                                   │   Backend   │
│             │                                   │     API     │
└──────┬──────┘                                   └──────┬──────┘
       │                                                 │
       │  POST /api/events                              │
       │  (no Authorization header)                     │
       │────────────────────────────────────────────────>│
       │                                                 │
       │                                                 │
       │  201 Created (user_id: null)                   │
       │<────────────────────────────────────────────────│
```

## Polityki RLS (Row Level Security)

### Tabela `events`

**SELECT:**
- Zalogowani użytkownicy: `user_id = auth.uid()`
- Goście: brak dostępu do zapisanych wydarzeń

**INSERT:**
- Zalogowani: `user_id = auth.uid()`
- Goście: `user_id IS NULL` (specjalna polityka)

**UPDATE/DELETE:**
- Tylko właściciel: `user_id = auth.uid()`
- Goście: brak uprawnień

## Zmienne Środowiskowe

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Backend nie potrzebuje dodatkowych kluczy auth
# Wszystko odbywa się przez Supabase SDK
```

## Migracja z Własnej Implementacji

❌ **USUNIĘTE (nie będą implementowane):**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `PATCH /api/auth/password`
- `DELETE /api/auth/account`
- DTOs: `RegisterUserDTO`, `LoginUserDTO`, `ChangePasswordDTO`, etc.

✅ **ZACHOWANE:**
- Middleware wstrzykujący Supabase client do `context.locals`
- Weryfikacja tokenów w API routes przez `supabase.auth.getUser()`
- Polityki RLS w bazie danych
- Obsługa zarówno użytkowników zalogowanych jak i gości

## Dokumentacja Referencyjna

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signup)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## FAQ

**Q: Czy mogę używać innych dostawców OAuth (Google, GitHub)?**
A: Tak! Supabase Auth wspiera wielu dostawców OAuth. Wystarczy skonfigurować je w dashboard Supabase.

**Q: Jak obsłużyć reset hasła?**
A: Supabase Auth zapewnia `supabase.auth.resetPasswordForEmail(email)` - wszystko po stronie klienta.

**Q: Czy tokeny są bezpieczne?**
A: Tak. JWT są podpisywane przez Supabase i weryfikowane w każdym żądaniu. Access token wygasa po 1h.

**Q: Co z GDPR i danymi użytkowników?**
A: Supabase jest zgodny z GDPR. Dane użytkowników są przechowywane zgodnie z wybraną lokalizacją serwera.

**Q: Czy mogę dostosować czas wygaśnięcia tokenu?**
A: Tak, w pliku `supabase/config.toml` w sekcji `[auth]` możesz ustawić `jwt_expiry`.
