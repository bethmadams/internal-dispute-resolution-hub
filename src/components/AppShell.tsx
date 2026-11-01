import { Link, useRouter } from "@tanstack/react-router";
import { Scale, LogOut, LayoutDashboard, Library, BarChart3, Bell, CalendarClock, ShieldCheck, BookOpen, GraduationCap, MapPin, Menu, X, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-session";
import { rolesQuery, ROLE_LABELS } from "@/lib/hub";
import { NotificationBell } from "@/components/NotificationBell";
import { HubNoticeDispatcher } from "@/components/HubNoticeDispatcher";
import { PersonalReminderAlerts } from "@/components/PersonalReminderAlerts";
import { StageEmailDispatcher } from "@/components/StageEmailDispatcher";
import type { ReactNode } from "react";
import { useState } from "react";

const nav = [
  { to: "/case-dashboard", label: "Case Dashboard", icon: LayoutDashboard },
  { to: "/dashboard", label: "Case Board", icon: LayoutDashboard },
  { to: "/metrics", label: "Metrics | Reporting", icon: BarChart3 },
  { to: "/resources", label: "Resource Library", icon: Library },
  { to: "/notifications", label: "My Notifications", icon: Bell },
  { to: "/reminders", label: "My Reminders", icon: CalendarClock },
  { to: "/team", label: "Admin", icon: ShieldCheck },
  { to: "/manual", label: "User Manual | SOP", icon: BookOpen },
  { to: "/training", label: "Training View", icon: GraduationCap },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: roles } = useQuery(rolesQuery);
  const myRole = roles?.find((r) => r.user_id === user?.id)?.role;
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleNav = nav.filter(i => i.to !== "/team" || myRole === "admin");

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="portal-workspace min-h-screen bg-background">
      <aside className={`${menuOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex`}>
        <div className="flex items-start justify-between px-7 pt-9 pb-8">
          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-sidebar-accent-foreground">
            <span className="font-display text-4xl font-bold">eXp</span><span className="h-10 border-l border-sidebar-foreground/30" /><Scale className="size-7" />
          </Link>
          <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="text-sidebar-foreground lg:hidden"><X className="size-4" /></Button>
        </div>
        <p className="px-7 text-sm font-semibold leading-6 text-sidebar-accent-foreground">Internal Dispute<br />Resolution Portal</p>
        <nav aria-label="Main navigation" className="mt-7 flex-1 overflow-y-auto px-5">
          <p className="mb-3 border-t border-sidebar-border pt-6 pl-3 text-[10px] tracking-widest text-sidebar-foreground/65 uppercase">Regulatory Relations</p>
          {visibleNav.map(item => <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} activeOptions={{ exact: true }} className={`mb-1 flex items-center gap-3 rounded-md px-3 py-3 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground ${item.to === "/team" ? "mt-5 border-t border-sidebar-border pt-5" : ""}`}><item.icon className="size-[18px] shrink-0 text-sidebar-foreground/70" />{item.label}</Link>)}
        </nav>
        <div className="mx-7 mt-5 mb-6 border-t border-sidebar-border pt-4"><p className="truncate text-xs" title={user?.email}>{user?.email}</p><p className="mt-1 text-[10px] uppercase text-sidebar-foreground/60">{myRole ? ROLE_LABELS[myRole] : ""}</p></div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-border bg-card">
          <div className="flex h-[74px] items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu className="size-5" /></Button><span className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-primary uppercase"><MapPin className="size-4" />Case workspace</span></div>
            <div className="flex items-center gap-1 sm:gap-3"><Button variant="ghost" size="sm" asChild><Link to="/dashboard"><Home className="size-4" /><span className="hidden sm:inline">Home</span></Link></Button>{myRole === "admin" && <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild><Link to="/team"><ShieldCheck className="size-4" />Admin</Link></Button>}<NotificationBell /><HubNoticeDispatcher /><Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out"><LogOut className="size-4" /><span className="hidden sm:inline">Sign out</span></Button></div>
          </div>
        </header>
        <PersonalReminderAlerts />
        <StageEmailDispatcher />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
