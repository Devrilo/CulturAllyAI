import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharacterCounter } from "@/components/generator/CharacterCounter";

interface InlineEditAreaProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  disabled?: boolean;
  maxLength?: number;
}

/**
 * Inline editing component for event description
 * Styled consistently with generator form
 */
export function InlineEditArea({
  initialValue,
  onSave,
  onCancel,
  disabled = false,
  maxLength = 500,
}: InlineEditAreaProps) {
  const [value, setValue] = useState(initialValue);

  const hasChanges = value !== initialValue;
  const isValid = value.length > 0 && value.length <= maxLength;
  const canSave = hasChanges && isValid && !disabled;

  const handleSave = () => {
    if (canSave) {
      onSave(value);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    onCancel();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-description" className="text-sm font-medium">
            Edytuj opis wydarzenia
          </Label>
          <CharacterCounter current={value.length} max={maxLength} />
        </div>

        <Textarea
          id="edit-description"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          rows={8}
          className={`resize-none ${value.length > maxLength ? "border-destructive" : ""}`}
          aria-invalid={value.length > maxLength}
          aria-describedby="edit-description-counter"
          placeholder="Wprowadź opis wydarzenia..."
        />

        {value.length > maxLength && (
          <p className="text-sm text-destructive" role="alert">
            Opis przekracza maksymalną długość {maxLength} znaków
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={disabled} size="sm">
          Anuluj
        </Button>
        <Button type="button" onClick={handleSave} disabled={!canSave} size="sm">
          {disabled ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>
    </div>
  );
}
