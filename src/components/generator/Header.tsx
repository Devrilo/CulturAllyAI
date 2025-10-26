import { Button } from "../ui/button";
import { User, FileText } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
}

/**
 * Application header with navigation and auth controls
 */
export function Header({ isAuthenticated, onSignOut }: HeaderProps) {
  return (
    <header className="border-b bg-background">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <a href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            CulturAllyAI
          </a>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <a href="/events" className="flex items-center gap-2 text-primary hover:underline">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Moje wydarzenia
              </a>
              <a href="/profile" className="flex items-center gap-2 text-primary hover:underline">
                <User className="h-4 w-4" aria-hidden="true" />
                Profil
              </a>
              <Button onClick={onSignOut} variant="destructive">
                Wyloguj
              </Button>
            </>
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
