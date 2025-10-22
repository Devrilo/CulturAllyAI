import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { CharacterCounter } from "./CharacterCounter";
import type { EventFormValues, EventFormErrors, EventCategoryDTO, AgeCategoryDTO } from "../../types";

interface EventFormProps {
  values: EventFormValues;
  errors: EventFormErrors;
  onChange: <K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) => void;
  onSubmit: () => void;
  disabled: boolean;
  categories: EventCategoryDTO[];
  ageCategories: AgeCategoryDTO[];
}

/**
 * Event creation form with validation and character counters
 */
export function EventForm({ values, errors, onChange, onSubmit, disabled, categories, ageCategories }: EventFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formularz tworzenia wydarzenia">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Tytuł wydarzenia <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="title"
            type="text"
            value={values.title}
            onChange={(e) => onChange("title", e.target.value)}
            disabled={disabled}
            maxLength={100}
            placeholder="np. Koncert Chopina"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : "title-counter"}
            className={`pr-16 ${errors.title ? "border-destructive" : ""}`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 right-3">
            <CharacterCounter current={values.title.length} max={100} aria-describedby="title-counter" />
          </div>
        </div>
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      {/* Event Date */}
      <div className="space-y-2">
        <Label htmlFor="event_date">
          Data wydarzenia <span className="text-destructive">*</span>
        </Label>
        <Input
          id="event_date"
          type="date"
          value={values.event_date.split("T")[0] || ""}
          onChange={(e) => {
            // Convert to ISO datetime format
            const dateValue = e.target.value ? `${e.target.value}T00:00:00.000Z` : "";
            onChange("event_date", dateValue);
          }}
          disabled={disabled}
          min={today}
          aria-invalid={!!errors.event_date}
          aria-describedby={errors.event_date ? "event_date-error" : undefined}
          className={errors.event_date ? "border-destructive" : ""}
        />
        {errors.event_date && (
          <p id="event_date-error" className="text-sm text-destructive" role="alert">
            {errors.event_date}
          </p>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">
          Gdzie? <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="city"
            type="text"
            value={values.city}
            onChange={(e) => onChange("city", e.target.value)}
            disabled={disabled}
            maxLength={50}
            placeholder="np. Warszawa"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "city-error" : "city-counter"}
            className={`pr-16 ${errors.city ? "border-destructive" : ""}`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 right-3">
            <CharacterCounter current={values.city.length} max={50} aria-describedby="city-counter" />
          </div>
        </div>
        {errors.city && (
          <p id="city-error" className="text-sm text-destructive" role="alert">
            {errors.city}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Kategoria wydarzenia <span className="text-destructive">*</span>
        </Label>
        <Select
          value={values.category}
          onValueChange={(value) => onChange("category", value as EventFormValues["category"])}
          disabled={disabled}
        >
          <SelectTrigger
            id="category"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? "category-error" : undefined}
            className={`w-full ${errors.category ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder="Wybierz kategorię" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p id="category-error" className="text-sm text-destructive" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      {/* Age Category */}
      <div className="space-y-2">
        <Label htmlFor="age_category">
          Dla kogo? <span className="text-destructive">*</span>
        </Label>
        <Select
          value={values.age_category}
          onValueChange={(value) => onChange("age_category", value as EventFormValues["age_category"])}
          disabled={disabled}
        >
          <SelectTrigger
            id="age_category"
            aria-invalid={!!errors.age_category}
            aria-describedby={errors.age_category ? "age_category-error" : undefined}
            className={`w-full ${errors.age_category ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder="Wybierz grupę wiekową" />
          </SelectTrigger>
          <SelectContent>
            {ageCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.age_category && (
          <p id="age_category-error" className="text-sm text-destructive" role="alert">
            {errors.age_category}
          </p>
        )}
      </div>

      {/* Key Information */}
      <div className="space-y-2">
        <Label htmlFor="key_information">
          Najważniejsze informacje <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Textarea
            id="key_information"
            value={values.key_information}
            onChange={(e) => onChange("key_information", e.target.value)}
            disabled={disabled}
            maxLength={200}
            rows={4}
            placeholder="Opisz kluczowe szczegóły wydarzenia..."
            aria-invalid={!!errors.key_information}
            aria-describedby={errors.key_information ? "key_information-error" : "key_information-counter"}
            className={errors.key_information ? "border-destructive" : ""}
          />
          <div className="absolute bottom-2 right-2">
            <CharacterCounter
              current={values.key_information.length}
              max={200}
              aria-describedby="key_information-counter"
            />
          </div>
        </div>
        {errors.key_information && (
          <p id="key_information-error" className="text-sm text-destructive" role="alert">
            {errors.key_information}
          </p>
        )}
      </div>

      {/* Form-level error */}
      {errors.form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4" role="alert">
          <p className="text-sm text-destructive">{errors.form}</p>
        </div>
      )}
    </form>
  );
}
