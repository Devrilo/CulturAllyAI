# Authentication Components

This directory contains all authentication-related UI components for CulturAllyAI.

## Components

### AuthPageShell

Common wrapper for authentication pages (login, register).

**Features:**

- Centered layout with logo (Sparkles icon)
- Title and optional subtitle
- Consistent card design
- Footer slot for links
- Dark mode support

**Usage:**

```tsx
<AuthPageShell title="Zaloguj się" subtitle="Generuj opisy wydarzeń kulturalnych z pomocą AI">
  <LoginForm />
  <div slot="footerLinks">
    <p>
      Nie masz konta? <a href="/register">Zarejestruj się</a>
    </p>
  </div>
</AuthPageShell>
```

### AuthErrorAlert

Maps Supabase Auth error codes to user-friendly Polish messages.

**Supported Errors:**

- `Invalid login credentials` → "Nieprawidłowy email lub hasło"
- `Email not confirmed` → "Email nie został potwierdzony..."
- `User already registered` → "Użytkownik z tym adresem email już istnieje"
- HTTP 429 → "Zbyt wiele prób..."
- HTTP 5xx → "Problem z serwerem..."

**Usage:**

```tsx
const [authError, setAuthError] = useState<AuthError | null>(null);

<AuthErrorAlert error={authError} />;
```

### LoginForm

Email/password login form with Supabase Auth integration.

**Features:**

- Email and password fields
- Zod validation (`loginSchema`)
- Loading state with Loader2 icon
- Error handling via `AuthErrorAlert`
- Auto-redirect after successful login
- Optional activity logging (fire-and-forget)

**Flow:**

1. User fills form
2. Client-side validation (Zod)
3. Call `supabaseClient.auth.signInWithPassword()`
4. On success: log activity → redirect to `redirectTo` or `/`
5. On error: display error message

### RegisterForm

Registration form with password strength indicator.

**Features:**

- Email, password, confirm password fields
- 5-level password strength indicator (visual bar + label)
- Colors: red → orange → yellow → green → dark green
- Live update during typing (`aria-live="polite"`)
- Zod validation (`registerSchema`)
- Auto-login after registration (MVP without email confirmation)

**Password Requirements:**

- Minimum 8 characters
- At least one letter
- At least one number

**Flow:**

1. User fills form
2. Client-side validation (Zod + password match)
3. Call `supabaseClient.auth.signUp()`
4. Call `supabaseClient.auth.signInWithPassword()` (auto-login)
5. On success: log activity → redirect to `/`

## Related Hooks

### useAuthRedirect

Manages `redirect` parameter in auth flows.

**API:**

```tsx
const { redirectTo, navigateToRedirect, buildLoginUrl, buildRegisterUrl } = useAuthRedirect();

// Navigate to redirect target or fallback
navigateToRedirect("/");

// Build login URL with current page as redirect
const loginUrl = buildLoginUrl(); // e.g., /login?redirect=/settings
```

**Security:** Only allows relative paths starting with `/` (prevents open redirect).

## Validators

### auth.ts (`src/lib/validators/auth.ts`)

**Schemas:**

- `loginSchema` - email + password (basic validation)
- `registerSchema` - email + password + confirmPassword (with match check)
- `changePasswordSchema` - newPassword + confirmPassword
- `deleteAccountSchema` - password + confirmDeletion (boolean)

**Utilities:**

- `calculatePasswordStrength(password: string): number` - returns 0-4
- `getPasswordStrengthLabel(score: number): string` - Polish labels
- `getPasswordStrengthColor(score: number): string` - Tailwind classes

## Accessibility

All components follow ARIA best practices:

- `aria-label` for forms and inputs
- `aria-describedby` for error messages and hints
- `aria-invalid` for validation states
- `aria-live="polite"` for password strength updates
- `aria-busy` for loading states
- Semantic HTML (form, label, button)

## Dark Mode

All components support dark mode via Tailwind's `dark:` variant:

- Colors adjust automatically (e.g., `bg-background`, `text-foreground`)
- Focus rings and borders respect theme
- Consistent with generator components

## Error Handling

### Client-Side Validation

- Zod schemas validate before API calls
- Field-level error messages (inline)
- Clear focus on first invalid field

### Supabase Auth Errors

- Caught as `AuthError` type
- Mapped to Polish messages in `AuthErrorAlert`
- Non-blocking (user can retry)

### Network Errors

- Generic error message
- Logged to console with `error.code` and `error.message`
- Never expose tokens or sensitive data

## Testing

See `docs/manual-tests/` for auth flow test plans:

- Login flow (valid/invalid credentials)
- Registration flow (with/without auto-login)
- Password strength indicator validation
- Redirect parameter handling
- Error message display

## Backend Integration (TODO)

These components are ready for backend integration:

- Middleware for SSR protection (redirect to `/login?redirect=...`)
- API endpoint `POST /api/auth/activity` for audit logging
- Supabase cookies reading in middleware
- JWT verification in protected routes

See `auth-spec.md` for complete backend specification.
