import type { ReactNode } from "react";

interface EventsLayoutProps {
  children: ReactNode;
}

export function EventsLayout({ children }: EventsLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <div className="flex flex-col lg:flex-row gap-6">{children}</div>
    </div>
  );
}
