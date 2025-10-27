import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { SavedEventViewModel, EventsListStatus } from "@/types";
import { InfiniteScrollObserver } from "./InfiniteScrollObserver";
import { EventCard } from "./EventCard";

interface EventListProps {
  events: SavedEventViewModel[];
  status: EventsListStatus;
  onLoadMore: () => void;
  hasNextPage: boolean;
  onCopy: (description: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newDescription: string) => void;
}

export function EventList({ events, status, onLoadMore, hasNextPage, onCopy, onDelete, onEdit }: EventListProps) {
  const { isLoading, isFetchingNext, isError, errorCode } = status;

  // Initial loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-destructive mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
        <p className="text-muted-foreground mb-4">
          {errorCode === "401" || errorCode === "403"
            ? "Sesja wygasła. Zaloguj się ponownie."
            : "Nie udało się pobrać wydarzeń. Sprawdź połączenie z internetem."}
        </p>
        <Button onClick={() => window.location.reload()}>Odśwież stronę</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Event cards */}
      {events.map((event) => (
        <EventCard key={event.id} event={event} onCopy={onCopy} onDelete={onDelete} onEdit={onEdit} />
      ))}

      {/* Infinite scroll trigger */}
      {hasNextPage && <InfiniteScrollObserver onIntersect={onLoadMore} disabled={isFetchingNext} />}

      {/* Loading next page */}
      {isFetchingNext && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Load more fallback button */}
      {hasNextPage && !isFetchingNext && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={onLoadMore}>
            Wczytaj więcej
          </Button>
        </div>
      )}
    </div>
  );
}
