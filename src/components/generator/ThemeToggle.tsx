import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "../hooks/useTheme";

/**
 * Theme toggle button for switching between light and dark mode
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Przełącz na tryb ciemny" : "Przełącz na tryb jasny"}
      title={theme === "light" ? "Przełącz na tryb ciemny" : "Przełącz na tryb jasny"}
      className="hover:bg-accent"
    >
      {theme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" aria-hidden="true" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem]" aria-hidden="true" />
      )}
    </Button>
  );
}
