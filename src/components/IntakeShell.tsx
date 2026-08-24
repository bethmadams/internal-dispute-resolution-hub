import { Link } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import type { ReactNode } from "react";
import { REGULATORY_EMAIL } from "@/lib/intake";

export function IntakeShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-ink text-ink-foreground">
              <Scale className="size-4" />
            </span>
            <span className="font-display text-sm font-semibold">IDR Hub</span>
          </Link>
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Staff sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="rule-label">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{intro}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          If additional information needs to be submitted later, email {REGULATORY_EMAIL} with your
          full name and state in the subject line.
        </p>
      </main>
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
