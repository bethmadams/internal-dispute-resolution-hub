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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { caseAccessQuery, formatDate, profilesQuery, rolesQuery } from "@/lib/hub";

export function CaseAccess({ caseId, isClosed }: { caseId: string; isClosed: boolean }) {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const [userId, setUserId] = useState("");
  const [expires, setExpires] = useState("");

  const { data: grants = [] } = useQuery(caseAccessQuery(caseId));
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: roles = [] } = useQuery(rolesQuery);

  const viewers = profiles.filter(
    (p) => (roles.find((r) => r.user_id === p.id)?.role ?? "viewer") === "viewer",
  );
  const nameOf = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    return p?.full_name || p?.email || "Unknown user";
  };

  const grant = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("case_access").insert({
        dispute_id: caseId,
        user_id: userId,
        granted_by: user?.id ?? null,
        expires_at: expires ? new Date(expires).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setUserId("");
      setExpires("");
      queryClient.invalidateQueries({ queryKey: ["case_access", caseId] });
      toast.success("Access granted");
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
        Viewers only see cases they are granted here. Access is removed automatically when the case
        is moved to Closed.
      </p>

      {isClosed ? (
        <p className="mt-4 text-sm text-muted-foreground">
          This case is closed, so viewer access has been revoked and cannot be granted.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <div className="space-y-2">
            <Label>Viewer</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a viewer" />
              </SelectTrigger>
              <SelectContent>
                {viewers.length === 0 && (
                  <SelectItem value="none" disabled>
                    No viewer accounts yet
                  </SelectItem>
                )}
                {viewers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button
            onClick={() => grant.mutate()}
            disabled={!userId || userId === "none" || grant.isPending}
          >
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
              <p className="text-sm font-medium">{nameOf(g.user_id)}</p>
              <p className="text-xs text-muted-foreground">
                Granted {formatDate(g.created_at)}
                {g.expires_at ? ` · expires ${formatDate(g.expires_at)}` : ""}
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
