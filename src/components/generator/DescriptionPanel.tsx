import { DescriptionPreview } from "./DescriptionPreview";
import { ActionButtons } from "./ActionButtons";
import { RatingButtons } from "./RatingButtons";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Copy } from "lucide-react";
import type { GeneratedEventViewModel, Feedback } from "../../types";

interface DescriptionPanelProps {
  generated: GeneratedEventViewModel | null;
  isGenerating: boolean;
  isSaving: boolean;
  isCopying: boolean;
  isAuthenticated: boolean;
  onGenerate: () => void;
  onSave: () => void;
  onCopy: () => void;
  onRate: (feedback: Feedback) => void;
}

/**
 * Container panel for description preview and action buttons
 */
export function DescriptionPanel({
  generated,
  isGenerating,
  isSaving,
  isCopying,
  isAuthenticated,
  onGenerate,
  onSave,
  onCopy,
  onRate,
}: DescriptionPanelProps) {
  const canGenerate = true; // Always allow generate (validation in form)
  const canSave = isAuthenticated && !!generated && generated.createdByAuthenticated;
  const canCopy = !!generated;
  const canRate = isAuthenticated && !!generated && generated.createdByAuthenticated;
  const isSaved = generated?.saved || false;
  const isRatingLocked = !!generated?.feedback;

  return (
    <div className="space-y-6">
      {/* Header with title and copy button in one line */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Wygenerowany opis</h2>
        {generated && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onCopy}
                  disabled={!canCopy || isCopying}
                  variant="ghost"
                  size="icon"
                  aria-label="Kopiuj do schowka"
                  aria-busy={isCopying}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Kopiuj do schowka</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Preview */}
      <DescriptionPreview generated={generated} showSkeleton={isGenerating} />

      {/* Generate, Save and Rating Buttons in one row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <ActionButtons
            canGenerate={canGenerate}
            canSave={canSave}
            isGenerating={isGenerating}
            isSaving={isSaving}
            isSaved={isSaved}
            isAuthenticated={isAuthenticated}
            onGenerate={onGenerate}
            onSave={onSave}
          />
        </div>
        {generated && (
          <RatingButtons
            currentRating={generated.feedback}
            disabled={!canRate}
            locked={isRatingLocked}
            isAuthenticated={isAuthenticated}
            onRate={onRate}
          />
        )}
      </div>
    </div>
  );
}
