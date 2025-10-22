import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import type { Feedback } from "../../types";

interface RatingButtonsProps {
  currentRating: Feedback | null;
  disabled: boolean;
  locked: boolean;
  isAuthenticated: boolean;
  onRate: (feedback: Feedback) => void;
}

/**
 * Rating buttons (thumbs up/down) for generated descriptions
 */
export function RatingButtons({ currentRating, disabled, locked, isAuthenticated, onRate }: RatingButtonsProps) {
  const isThumbsUp = currentRating === "thumbs_up";
  const isThumbsDown = currentRating === "thumbs_down";

  const getTooltip = () => {
    if (!isAuthenticated) return "Zaloguj się, aby ocenić wydarzenie";
    if (locked) return "Już ocenione";
    return "";
  };

  const tooltip = getTooltip();

  return (
    <TooltipProvider>
      <div className="flex gap-2" role="group" aria-label="Oceń wygenerowany opis">
        {/* Thumbs Up */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                onClick={() => onRate("thumbs_up")}
                disabled={disabled || locked}
                variant="ghost"
                size="icon"
                className={`transition-colors ${isThumbsUp ? "text-green-600 hover:text-green-600 dark:text-green-400" : ""}`}
                aria-label="Kciuk w górę"
                aria-pressed={isThumbsUp}
              >
                <ThumbsUp className={`h-4 w-4 ${isThumbsUp ? "fill-current" : ""}`} aria-hidden="true" />
              </Button>
            </span>
          </TooltipTrigger>
          {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
          {!tooltip && <TooltipContent>Podoba mi się</TooltipContent>}
        </Tooltip>

        {/* Thumbs Down */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                onClick={() => onRate("thumbs_down")}
                disabled={disabled || locked}
                variant="ghost"
                size="icon"
                className={`transition-colors ${isThumbsDown ? "text-red-600 hover:text-red-600 dark:text-red-400" : ""}`}
                aria-label="Kciuk w dół"
                aria-pressed={isThumbsDown}
              >
                <ThumbsDown className={`h-4 w-4 ${isThumbsDown ? "fill-current" : ""}`} aria-hidden="true" />
              </Button>
            </span>
          </TooltipTrigger>
          {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
          {!tooltip && <TooltipContent>Nie podoba mi się</TooltipContent>}
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
