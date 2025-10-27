import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EventsSortOption } from "@/types";

interface SortSelectProps {
  value: EventsSortOption;
  onChange: (value: EventsSortOption) => void;
  disabled?: boolean;
}

const SORT_OPTIONS = [
  { value: "created_at-desc", label: "Najnowsze" },
  { value: "created_at-asc", label: "Najstarsze" },
  { value: "event_date-desc", label: "Data wydarzenia (malejąco)" },
  { value: "event_date-asc", label: "Data wydarzenia (rosnąco)" },
  { value: "title-asc", label: "Tytuł (A-Z)" },
  { value: "title-desc", label: "Tytuł (Z-A)" },
] as const;

export function SortSelect({ value, onChange, disabled = false }: SortSelectProps) {
  const currentValue = `${value.sort}-${value.order}`;

  const handleChange = (newValue: string) => {
    const [sort, order] = newValue.split("-") as [EventsSortOption["sort"], EventsSortOption["order"]];
    onChange({ sort, order });
  };

  return (
    <div className="space-y-2">
      <label htmlFor="sort-select" className="text-sm font-medium">
        Sortowanie
      </label>
      <Select value={currentValue} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger id="sort-select">
          <SelectValue placeholder="Wybierz sortowanie" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
