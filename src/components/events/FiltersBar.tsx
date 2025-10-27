import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { EventsFiltersState, EventCategoryDTO, AgeCategoryDTO, EventCategory, AgeCategory } from "@/types";
import { SortSelect } from "./SortSelect";

interface FiltersBarProps {
  filters: EventsFiltersState;
  categories: EventCategoryDTO[];
  ageCategories: AgeCategoryDTO[];
  onChange: (filters: Partial<Omit<EventsFiltersState, "saved">>) => void;
  disabled?: boolean;
}

export function FiltersBar({ filters, categories, ageCategories, onChange, disabled = false }: FiltersBarProps) {
  const hasActiveFilters = !!(filters.category || filters.age_category);

  const handleReset = () => {
    onChange({
      category: undefined,
      age_category: undefined,
      sort: "created_at",
      order: "desc",
    });
  };

  return (
    <div className="space-y-6 p-6 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtry</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={disabled}>
            Wyczyść
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label htmlFor="category-filter" className="text-sm font-medium">
          Kategoria wydarzenia
        </label>
        <Select
          value={filters.category || ""}
          onValueChange={(value) => {
            const newCategory = value === "" ? undefined : (value as EventCategory);
            onChange({ category: newCategory });
          }}
          disabled={disabled}
        >
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="Wszystkie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Age Category Filter */}
      <div className="space-y-2">
        <label htmlFor="age-category-filter" className="text-sm font-medium">
          Kategoria wiekowa
        </label>
        <Select
          value={filters.age_category || ""}
          onValueChange={(value) => {
            const newAgeCategory = value === "" ? undefined : (value as AgeCategory);
            onChange({ age_category: newAgeCategory });
          }}
          disabled={disabled}
        >
          <SelectTrigger id="age-category-filter">
            <SelectValue placeholder="Wszystkie" />
          </SelectTrigger>
          <SelectContent>
            {ageCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort Select */}
      <SortSelect
        value={{ sort: filters.sort, order: filters.order }}
        onChange={({ sort, order }) => onChange({ sort, order })}
        disabled={disabled}
      />
    </div>
  );
}
