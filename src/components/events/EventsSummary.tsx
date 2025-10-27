import { Button } from "@/components/ui/button";

interface EventsSummaryProps {
  total: number;
  activeFilters: number;
  onClearFilters?: () => void;
}

export function EventsSummary({ total, activeFilters, onClearFilters }: EventsSummaryProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Moje Wydarzenia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total === 0 ? "Brak wydarzeń" : `Znaleziono ${total} ${total === 1 ? "wydarzenie" : "wydarzeń"}`}
          {activeFilters > 0 && ` (${activeFilters} ${activeFilters === 1 ? "filtr" : "filtry"} aktywne)`}
        </p>
      </div>
      {activeFilters > 0 && onClearFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Resetuj filtry
        </Button>
      )}
    </div>
  );
}
