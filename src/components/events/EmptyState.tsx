import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  visible: boolean;
  filtered: boolean;
  onReset?: () => void;
}

export function EmptyState({ visible, filtered, onReset }: EmptyStateProps) {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6">
        <svg
          className="mx-auto h-24 w-24 text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      {filtered ? (
        <>
          <h3 className="text-lg font-semibold mb-2">Brak wydarzeń spełniających kryteria</h3>
          <p className="text-muted-foreground mb-6">Spróbuj zmienić filtry, aby zobaczyć więcej wyników</p>
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              Resetuj filtry
            </Button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">Nie masz jeszcze zapisanych wydarzeń</h3>
          <p className="text-muted-foreground mb-6">
            Wygeneruj i zapisz swoje pierwsze wydarzenie, aby zobaczyć je tutaj
          </p>
          <Button asChild>
            <a href="/">Wygeneruj pierwsze wydarzenie</a>
          </Button>
        </>
      )}
    </div>
  );
}
