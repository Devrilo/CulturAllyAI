import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { SavedEventViewModel } from "@/types";
import { EventMeta } from "./EventMeta";
import { CopyButton } from "./CopyButton";
import { DeleteAction } from "./DeleteAction";
import { InlineEditArea } from "./InlineEditArea";

interface EventCardProps {
  event: SavedEventViewModel;
  onCopy: (description: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newDescription: string) => void;
  isCopying?: boolean;
  isDeleting?: boolean;
  isEditing?: boolean;
}

export function EventCard({
  event,
  onCopy,
  onDelete,
  onEdit,
  isCopying = false,
  isDeleting = false,
  isEditing = false,
}: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const displayDescription = event.editedDescription || event.description;
  const isLongDescription = displayDescription.length > 300;
  const shouldTruncate = isLongDescription && !isExpanded && !isEditMode;
  const truncatedDescription = shouldTruncate ? displayDescription.substring(0, 300) + "..." : displayDescription;

  const handleSave = (newDescription: string) => {
    onEdit(event.id, newDescription);
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const isAnyActionPending = isCopying || isDeleting || isEditing;

  return (
    <article
      className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
      aria-label={event.title}
    >
      {/* Event metadata */}
      <EventMeta
        title={event.title}
        eventDateLabel={event.eventDateLabel}
        city={event.city}
        categoryLabel={event.categoryLabel}
        ageCategoryLabel={event.ageCategoryLabel}
        actionButton={
          !isEditMode && <CopyButton onCopy={() => onCopy(displayDescription)} disabled={isAnyActionPending} />
        }
      />

      {/* Description */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">Opis wydarzenia</h4>
          <div className="flex items-center gap-2">
            {event.editedDescription && <Badge variant="secondary">Edytowany</Badge>}
            <Badge variant="secondary" className="text-xs">
              {event.charCount} znaków
            </Badge>
          </div>
        </div>

        {isEditMode ? (
          <InlineEditArea
            initialValue={displayDescription}
            onSave={handleSave}
            onCancel={handleCancelEdit}
            disabled={isEditing}
            maxLength={500}
          />
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{truncatedDescription}</p>

            {isLongDescription && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isAnyActionPending}
                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExpanded ? "Zwiń" : "Rozwiń"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 pt-4 border-t flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Utworzono: {new Date(event.createdAt).toLocaleDateString("pl-PL")}
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode && (
            <>
              <Button
                onClick={() => setIsEditMode(true)}
                disabled={isAnyActionPending}
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edytuj
              </Button>
              <DeleteAction onConfirm={() => onDelete(event.id)} pending={isAnyActionPending} />
            </>
          )}
        </div>
      </div>
    </article>
  );
}
