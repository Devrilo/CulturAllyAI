import { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { useSupabaseSession } from "../hooks/useSupabaseSession";
import { supabaseClient } from "../../db/supabase.client";
import { KeyRound, Trash2, User } from "lucide-react";

/**
 * Settings page component
 * Provides account management options (change password, delete account)
 */
export function SettingsPage() {
  const authState = useSupabaseSession(supabaseClient);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const handleOpenChangePassword = useCallback(() => {
    setChangePasswordOpen(true);
  }, []);

  const handleCloseChangePassword = useCallback(() => {
    setChangePasswordOpen(false);
  }, []);

  const handleOpenDeleteAccount = useCallback(() => {
    setDeleteAccountOpen(true);
  }, []);

  const handleCloseDeleteAccount = useCallback(() => {
    setDeleteAccountOpen(false);
  }, []);

  // Loading state
  if (authState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - should be handled by SSR protection
  if (!authState.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Musisz być zalogowany, aby zobaczyć tę stronę.</p>
          <a href="/login?redirect=/profile" className="mt-4 inline-block text-primary hover:underline">
            Zaloguj się
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8 pb-12">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Ustawienia konta</h1>
            <p className="text-muted-foreground">Zarządzaj swoim kontem i ustawieniami bezpieczeństwa</p>
          </div>

          {/* Account Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Informacje o koncie</h2>
                <p className="text-sm text-muted-foreground">
                  {authState.userId ? `ID: ${authState.userId.slice(0, 8)}...` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Bezpieczeństwo</h2>

            {/* Change Password */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-medium">Zmień hasło</h3>
                    <p className="text-sm text-muted-foreground">
                      Zaktualizuj swoje hasło. Po zmianie zostaniesz automatycznie wylogowany.
                    </p>
                  </div>
                </div>
                <Button onClick={handleOpenChangePassword} variant="outline">
                  Zmień
                </Button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="rounded-lg border border-destructive/50 bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                    <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-medium text-destructive">Usuń konto</h3>
                    <p className="text-sm text-muted-foreground">
                      Trwale usuń swoje konto. Ta operacja jest nieodwracalna. Twoje wydarzenia zostaną anonimizowane.
                    </p>
                  </div>
                </div>
                <Button onClick={handleOpenDeleteAccount} variant="destructive">
                  Usuń
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ChangePasswordModal isOpen={changePasswordOpen} onClose={handleCloseChangePassword} />
      <DeleteAccountModal isOpen={deleteAccountOpen} onClose={handleCloseDeleteAccount} />
    </div>
  );
}
