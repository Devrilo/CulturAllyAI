import { FormField } from "../ui/FormField";
import { fromISODateTime, toISODateTime, getTodayDateString } from "../../lib/utils/date-helpers";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formularz tworzenia wydarzenia">
      <FormField
        id="title"
        label="Tytuł wydarzenia"
        type="text"
        value={values.title}
        onChange={(value) => onChange("title", value)}
        error={errors.title}
        disabled={disabled}
        required
        maxLength={100}
        placeholder="np. Koncert Chopina"
      />

      <FormField
        id="event_date"
        label="Data wydarzenia"
        type="date"
        value={fromISODateTime(values.event_date)}
        onChange={(value) => onChange("event_date", toISODateTime(value))}
        error={errors.event_date}
        disabled={disabled}
        required
        min={getTodayDateString()}
      />

      <FormField
        id="city"
        label="Gdzie?"
        type="text"
        value={values.city}
        onChange={(value) => onChange("city", value)}
        error={errors.city}
        disabled={disabled}
        required
        maxLength={50}
        placeholder="np. Warszawa"
      />

      <FormField
        id="category"
        label="Kategoria wydarzenia"
        type="select"
        value={values.category}
        onChange={(value) => onChange("category", value as EventFormValues["category"])}
        error={errors.category}
        disabled={disabled}
        required
        placeholder="Wybierz kategorię"
        options={categories}
        aria-label="Kategoria wydarzenia"
      />

      <FormField
        id="age_category"
        label="Dla kogo?"
        type="select"
        value={values.age_category}
        onChange={(value) => onChange("age_category", value as EventFormValues["age_category"])}
        error={errors.age_category}
        disabled={disabled}
        required
        placeholder="Wybierz grupę wiekową"
        options={ageCategories}
        aria-label="Grupa wiekowa"
      />

      <FormField
        id="key_information"
        label="Najważniejsze informacje"
        type="textarea"
        value={values.key_information}
        onChange={(value) => onChange("key_information", value)}
        error={errors.key_information}
        disabled={disabled}
        required
        maxLength={200}
        rows={4}
        placeholder="Opisz kluczowe szczegóły wydarzenia..."
      />

      {/* Form-level error */}
      {errors.form && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4" role="alert">
          <p className="text-sm text-destructive">{errors.form}</p>
        </div>
      )}
    </form>
  );
}
