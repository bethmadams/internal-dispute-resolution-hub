import { Link, useRouter } from "@tanstack/react-router";
import { Scale, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-session";
import { rolesQuery } from "@/lib/hub";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Case Board" },
  { to: "/resources", label: "Resources" },
  { to: "/team", label: "Team" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: roles } = useQuery(rolesQuery);
  const myRole = roles?.find((r) => r.user_id === user?.id)?.role;

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-ink text-ink-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Scale className="size-4" />
            </span>
            <span className="font-display text-sm leading-tight font-semibold tracking-tight">
              Internal Dispute
              <span className="block text-[0.65rem] tracking-[0.2em] text-ink-foreground/60 uppercase">
                Resolution Hub
              </span>
            </span>
          </Link>
          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm text-ink-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-ink-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-ink-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium">{user?.email}</p>
              {myRole && (
                <p className="text-[0.65rem] tracking-[0.14em] text-ink-foreground/50 uppercase">
                  {myRole}
                </p>
              )}
            </div>
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Sign out"
              className="text-ink-foreground/70 hover:bg-sidebar-accent hover:text-ink-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <nav className="flex items-center gap-1 border-t border-sidebar-border px-4 pb-2 sm:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm text-ink-foreground/70 data-[status=active]:bg-sidebar-accent data-[status=active]:text-ink-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
