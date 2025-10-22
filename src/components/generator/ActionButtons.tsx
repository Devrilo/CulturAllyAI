import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Sparkles, Bookmark, BookmarkCheck } from "lucide-react";

interface ActionButtonsProps {
  canGenerate: boolean;
  canSave: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  isSaved: boolean;
  isAuthenticated: boolean;
  onGenerate: () => void;
  onSave: () => void;
}

/**
 * Action buttons for generator flow: Generate, Save (Copy removed - now in header)
 */
export function ActionButtons({
  canGenerate,
  canSave,
  isGenerating,
  isSaving,
  isSaved,
  isAuthenticated,
  onGenerate,
  onSave,
}: ActionButtonsProps) {
  const saveTooltip = !isAuthenticated ? "Zaloguj się, aby zapisać wydarzenie" : isSaved ? "Już zapisane" : "";

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {/* Generate Button */}
        <Button onClick={onGenerate} disabled={!canGenerate || isGenerating} className="gap-2" aria-busy={isGenerating}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {isGenerating ? "Generowanie..." : "Generuj opis"}
        </Button>

        {/* Save Button with Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                onClick={onSave}
                disabled={!canSave || isSaving || isSaved}
                variant="outline"
                className="gap-2"
                aria-busy={isSaving}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                    Zapisane
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                    {isSaving ? "Zapisywanie..." : "Zapisz"}
                  </>
                )}
              </Button>
            </span>
          </TooltipTrigger>
          {saveTooltip && <TooltipContent>{saveTooltip}</TooltipContent>}
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
