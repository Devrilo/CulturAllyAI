interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

/**
 * Character counter component with color coding
 * Shows red when >90% of limit
 */
export function CharacterCounter({ current, max, className = "" }: CharacterCounterProps) {
  const isNearLimit = current > max * 0.9;
  const isOverLimit = current > max;

  return (
    <span
      className={`text-sm ${isOverLimit ? "text-destructive" : isNearLimit ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"} ${className}`}
      aria-live="polite"
    >
      {current} / {max}
    </span>
  );
}
