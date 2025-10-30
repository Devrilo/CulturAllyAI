# Settings Components

This directory contains account management UI components for CulturAllyAI.

## Components

### SettingsPage

Main settings page component with account management options.

**Features:**

- Account info section (user ID preview)
- Security section with two options:
  - Change Password (KeyRound icon, outline button)
  - Delete Account (Trash2 icon, destructive button)
- Modal state management
- Authentication check (redirect to `/login?redirect=/settings` if not logged in)
- Loading state
- Dark mode support

**Usage:**

```tsx
// In settings.astro
<SettingsPage client:load />
```

**Layout:**

- Centered container (max-w-2xl)
- Card-based sections with icons
- Consistent spacing with generator page

### ChangePasswordModal

Modal for changing user password.

**Features:**

- **No current password required** - verified by active JWT session
- New password + confirmation fields
- 5-level password strength indicator (same as RegisterForm)
- Real-time validation
- Auto-logout after successful change
- Info notice about logout requirement
- Escape to close (when not submitting)

**Flow:**

1. User opens modal from Settings page
2. Enters new password + confirmation
3. Client-side validation (Zod + match check)
4. Call `supabaseClient.auth.updateUser({ password })`
5. On success: log activity → `signOut()` → redirect `/login?message=password_changed`
6. On error: display error via `AuthErrorAlert`

**Security:**

- Session-based verification (no need for old password)
- JWT must be valid (Supabase verifies)
- Forces logout to ensure new password is used everywhere

**Props:**

```tsx
interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### DeleteAccountModal

Modal for permanently deleting user account.

**Features:**

- Red header with warning icon (AlertTriangle)
- Warning message about irreversibility
- Password confirmation field
- Consent checkbox with explicit text
- Two-step confirmation (password + checkbox)
- Calls backend endpoint (not Supabase directly)
- Auto-logout after deletion

**Flow:**

1. User opens modal from Settings page
2. Enters password for verification
3. Checks consent checkbox
4. Client-side validation (Zod)
5. Call `POST /api/auth/delete-account` with Bearer token
6. Backend verifies password via `signInWithPassword()`
7. Backend calls `supabaseAdmin.auth.admin.deleteUser()`
8. On success: `signOut()` → redirect `/login?message=account_deleted`

**Data Handling:**

- User deleted from `auth.users` (Supabase)
- Events set to `user_id = NULL` (ON DELETE SET NULL)
- Preserves anonymized data for analytics (GDPR compliant)

**Props:**

```tsx
interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Backend Endpoint Required:**

```
POST /api/auth/delete-account
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "password": "user_password",
  "confirmDeletion": true
}
```

## Shared UI Components

### Checkbox (`src/components/ui/checkbox.tsx`)

Custom checkbox component matching shadcn/ui design.

**Features:**

- Native `<input type="checkbox">` with styled overlay
- Props: `checked`, `onCheckedChange`, `disabled`
- Focus ring, hover states
- Accessible (screen reader compatible)
- Check icon from lucide-react

**Usage:**

```tsx
<Checkbox
  checked={formData.confirmDeletion}
  onCheckedChange={(checked) => handleInputChange("confirmDeletion", checked)}
  disabled={isSubmitting}
/>
```

**Note:** Simple implementation without Radix UI. If full Radix features needed:

```bash
npm install @radix-ui/react-checkbox
```

## Validators

### Password Change Validation

```tsx
// changePasswordSchema
{
  newPassword: string (min 8, letter + number),
  confirmPassword: string (must match)
}
```

### Account Deletion Validation

```tsx
// deleteAccountSchema
{
  password: string (required),
  confirmDeletion: boolean (must be true)
}
```

## Accessibility

All components follow ARIA best practices:

- `role="dialog"` and `aria-modal="true"` for modals
- `aria-labelledby` for modal titles
- `aria-label` for close buttons
- `aria-invalid` and `aria-describedby` for form fields
- `aria-busy` for loading states
- Keyboard navigation (Tab, Escape)

## Dark Mode

All components support dark mode:

- Modal backdrop: `bg-background/80 backdrop-blur-sm`
- Cards: `bg-card border shadow-sm`
- Colors adjust automatically
- Consistent with auth and generator pages

## Error Handling

### Password Change Errors

- Weak password → inline validation error
- Password mismatch → "Hasła muszą być identyczne"
- Session expired → 401 from Supabase → redirect to login
- Network error → generic message + retry

### Account Deletion Errors

- Wrong password → "Nieprawidłowy email lub hasło"
- Backend error → error message from API response
- Network error → generic message + retry
- Checkbox not checked → "Musisz potwierdzić usunięcie konta"

## Security Considerations

### Change Password

- **No current password required** is secure because:
  - JWT session proves identity
  - Session can be revoked if compromised
  - Forced logout ensures new password propagates
- Better UX (user doesn't need to remember old password)
- Aligns with modern practices (GitHub, Google, etc.)

### Delete Account

- **Requires password** for final confirmation
- Two-step process (password + checkbox)
- Backend verifies password via Supabase Auth
- Admin API call ensures proper deletion
- Events anonymized (not deleted) per GDPR

## Testing

See `docs/manual-tests/` for test plans:

- Change password flow (success/error cases)
- Delete account flow (success/error cases)
- Password strength indicator validation
- Modal open/close behavior
- Logout after operations

## Backend Integration (TODO)

### Required Middleware

- SSR protection for `/settings` page
- Redirect to `/login?redirect=/settings` if not authenticated
- Pass `context.locals.supabase` to components

### Required Endpoint

```
POST /api/auth/delete-account
- Verify JWT from Authorization header
- Verify password via signInWithPassword()
- Call supabaseAdmin.auth.admin.deleteUser()
- Return 200 OK or error
```

### Required Database Changes

- Ensure `ON DELETE SET NULL` for `events.user_id`
- RLS policies for user data isolation
- Audit logging in `user_activity_logs`

See `auth-spec.md` for complete specification.

## Future Enhancements

### Possible Additions (Post-MVP)

- Email change with verification
- Two-factor authentication setup
- Active sessions management
- Download user data (GDPR export)
- Account recovery options

### UI Improvements

- Toast notifications for success states
- Confirmation dialogs before opening modals
- Password strength requirements checklist
- "Show password" toggle buttons
- Copy user ID to clipboard
