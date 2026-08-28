import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { caseAccessQuery, formatDate, profilesQuery } from "@/lib/hub";
import { US_STATES } from "@/lib/intake";

export function CaseAccess({ caseId, isClosed }: { caseId: string; isClosed: boolean }) {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [expires, setExpires] = useState("");

  const { data: grants = [] } = useQuery(caseAccessQuery(caseId));
  const { data: profiles = [] } = useQuery(profilesQuery);

  const toggleState = (s: string) =>
    setStates((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const labelFor = (g: (typeof grants)[number]) => {
    if (g.invite_name) return g.invite_name;
    const p = profiles.find((x) => x.id === g.user_id);
    return p?.full_name || p?.email || g.invite_email || "Unknown user";
  };

  const grant = useMutation({
    mutationFn: async () => {
      const clean = email.trim().toLowerCase();
      if (!clean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
        throw new Error("Enter a valid email address");
      }
      if (!name.trim()) throw new Error("Enter the viewer's name");
      const existing = profiles.find((p) => (p.email ?? "").toLowerCase() === clean);
      const { error } = await supabase.from("case_access").insert({
        dispute_id: caseId,
        user_id: existing?.id ?? null,
        invite_email: clean,
        invite_name: name.trim(),
        states,
        granted_by: user?.id ?? null,
        expires_at: expires ? new Date(expires).toISOString() : null,
      });
      if (error) throw error;
      return Boolean(existing);
    },
    onSuccess: (linked) => {
      setName("");
      setEmail("");
      setStates([]);
      setExpires("");
      queryClient.invalidateQueries({ queryKey: ["case_access", caseId] });
      toast.success(
        linked
          ? "Access granted"
          : "Access granted — they will see this case once they sign up with that email",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("case_access").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case_access", caseId] });
      toast.success("Access removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="panel p-6">
      <h2 className="text-lg font-semibold">Case access</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a viewer by email address. They only see this case, and access is removed automatically
        when the case is moved to Closed.
      </p>

      {isClosed ? (
        <p className="mt-4 text-sm text-muted-foreground">
          This case is closed, so viewer access has been revoked and cannot be granted.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="access-name">Name</Label>
              <Input
                id="access-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-email">Email address</Label>
              <Input
                id="access-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@exprealty.net"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-expires">Expires (optional)</Label>
              <Input
                id="access-expires"
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>State(s) licensed</Label>
            <div className="max-h-44 overflow-y-auto rounded-md border border-border p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {US_STATES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={states.includes(s)}
                      onCheckedChange={() => toggleState(s)}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={() => grant.mutate()} disabled={grant.isPending}>
            Grant access
          </Button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {grants.length === 0 && (
          <li className="text-sm text-muted-foreground">No viewers have access to this case.</li>
        )}
        {grants.map((g) => (
          <li
            key={g.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
          >
            <div>
              <p className="text-sm font-medium">{labelFor(g)}</p>
              {g.invite_email && <p className="text-xs text-muted-foreground">{g.invite_email}</p>}
              {g.states && g.states.length > 0 && (
                <p className="text-xs text-muted-foreground">Licensed: {g.states.join(", ")}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Granted {formatDate(g.created_at)}
                {g.expires_at ? ` · expires ${formatDate(g.expires_at)}` : ""}
                {!g.user_id ? " · pending sign-up" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">viewer</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revoke.mutate(g.id)}
                disabled={revoke.isPending}
              >
                <Trash2 className="size-4" /> Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
