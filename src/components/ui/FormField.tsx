import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { CharacterCounter } from "../generator/CharacterCounter";

interface FormFieldOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  type: "text" | "date" | "textarea" | "select";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  min?: string;
  options?: FormFieldOption[];
  "aria-label"?: string;
}

/**
 * Reusable form field component that handles Label, Input/Textarea/Select, CharacterCounter, and error display
 */
export function FormField({
  id,
  label,
  type,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder,
  maxLength,
  rows = 4,
  min,
  options = [],
  "aria-label": ariaLabel,
}: FormFieldProps) {
  const hasError = !!error;
  const errorId = `${id}-error`;
  const counterId = `${id}-counter`;

  const renderInput = () => {
    const commonProps = {
      id,
      disabled,
      "aria-invalid": hasError,
      "aria-describedby": hasError ? errorId : maxLength ? counterId : undefined,
      className: hasError ? "border-destructive" : "",
    };

    switch (type) {
      case "textarea":
        return (
          <div className="relative">
            <Textarea
              {...commonProps}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              maxLength={maxLength}
              rows={rows}
              placeholder={placeholder}
            />
            {maxLength && (
              <div className="absolute bottom-2 right-2">
                <CharacterCounter current={value.length} max={maxLength} aria-describedby={counterId} />
              </div>
            )}
          </div>
        );

      case "select":
        return (
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger
              {...commonProps}
              className={`w-full ${hasError ? "border-destructive" : ""}`}
              aria-label={ariaLabel}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Input {...commonProps} type="date" value={value} onChange={(e) => onChange(e.target.value)} min={min} />
        );

      case "text":
      default:
        return (
          <div className="relative">
            <Input
              {...commonProps}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              maxLength={maxLength}
              placeholder={placeholder}
              className={`${hasError ? "border-destructive" : ""} ${maxLength ? "pr-16" : ""}`}
            />
            {maxLength && (
              <div className="absolute top-1/2 -translate-y-1/2 right-3">
                <CharacterCounter current={value.length} max={maxLength} aria-describedby={counterId} />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {renderInput()}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
