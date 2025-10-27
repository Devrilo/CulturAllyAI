import { useEffect, useRef } from "react";

interface InfiniteScrollObserverProps {
  onIntersect: () => void;
  disabled?: boolean;
  rootMargin?: string;
}

/**
 * Sentinel component for infinite scroll using IntersectionObserver
 * When this element becomes visible, it triggers onIntersect callback
 */
export function InfiniteScrollObserver({
  onIntersect,
  disabled = false,
  rootMargin = "100px",
}: InfiniteScrollObserverProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onIntersect, disabled, rootMargin]);

  return <div ref={sentinelRef} className="h-4" aria-hidden="true" />;
}
