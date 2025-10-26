import { Sparkles } from "lucide-react";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLinks?: React.ReactNode;
}

/**
 * Common wrapper for auth pages (login, register)
 * Provides consistent layout with logo, title, and footer
 */
export function AuthPageShell({ title, subtitle, children, footerLinks }: AuthPageShellProps) {
  return (
    <div className="min-h-screen bg-background px-4 pt-20 pb-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Logo and branding */}
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CulturAllyAI</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Main title */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>

        {/* Form content */}
        <div className="rounded-lg border bg-card p-8 shadow-sm">{children}</div>

        {/* Footer links */}
        {footerLinks && <div className="text-center text-sm">{footerLinks}</div>}
      </div>
    </div>
  );
}
