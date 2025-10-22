import { Button } from "../ui/button";

interface HeaderProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
}

/**
 * Application header with navigation and auth controls
 */
export function Header({ isAuthenticated, onSignOut }: HeaderProps) {
  return (
    <header className="border-b">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold">CulturAllyAI</h1>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button onClick={onSignOut} variant="destructive">
              Wyloguj
            </Button>
          ) : (
            <>
              <a href="/login" className="text-primary hover:underline">
                Zaloguj się
              </a>
              <a href="/register" className="text-primary hover:underline">
                Zarejestruj się
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
