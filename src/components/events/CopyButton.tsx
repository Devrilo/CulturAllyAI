import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CopyButtonProps {
  onCopy: () => void;
  disabled?: boolean;
}

export function CopyButton({ onCopy, disabled = false }: CopyButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onCopy} disabled={disabled} variant="ghost" size="icon" aria-label="Kopiuj opis do schowka">
            <Copy className="h-4 w-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Kopiuj opis do schowka</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
