import { Skeleton } from "../ui/skeleton";
import type { GeneratedEventViewModel } from "../../types";

interface DescriptionPreviewProps {
  generated: GeneratedEventViewModel | null;
  showSkeleton: boolean;
}

/**
 * Preview panel for generated event description
 */
export function DescriptionPreview({ generated, showSkeleton }: DescriptionPreviewProps) {
  if (showSkeleton) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Ładowanie opisu">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (!generated) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
        <p className="text-center text-muted-foreground">
          Uzupełnij formularz i kliknij <br />
          <span className="font-semibold">&ldquo;Generuj opis&rdquo;</span>
        </p>
      </div>
    );
  }

  const description = generated.description.slice(0, 500);
  const isTruncated = generated.description.length > 500;

  return (
    <div role="region" aria-label="Podgląd opisu wydarzenia">
      {/* Description Text */}
      <div className="rounded-lg border bg-card p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{description}</p>
        {isTruncated && (
          <div className="mt-2 rounded-md bg-orange-50 p-2 dark:bg-orange-950">
            <p className="text-xs text-orange-800 dark:text-orange-200">Opis został skrócony do 500 znaków</p>
          </div>
        )}
      </div>
    </div>
  );
}
