import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

interface EventMetaProps {
  title: string;
  eventDateLabel: string;
  city: string;
  categoryLabel: string;
  ageCategoryLabel: string;
  actionButton?: ReactNode;
}

export function EventMeta({
  title,
  eventDateLabel,
  city,
  categoryLabel,
  ageCategoryLabel,
  actionButton,
}: EventMetaProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
      </div>
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span>{eventDateLabel}</span>
        <span>•</span>
        <span>{city}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{categoryLabel}</Badge>
        <Badge variant="secondary">{ageCategoryLabel}</Badge>
      </div>
    </div>
  );
}
