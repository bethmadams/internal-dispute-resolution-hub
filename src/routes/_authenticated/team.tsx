import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, invitesQuery, profilesQuery, rolesQuery } from "@/lib/hub";


const ROLES = ["admin", "investigator", "viewer"] as const;

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team & Roles | Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Manage who can access the dispute hub and what each staff member is allowed to do.",
      },
      { property: "og:title", content: "Team & Roles | Internal Dispute Resolution Hub" },
      {
        property: "og:description",
        content: "Staff directory and role assignments for the internal dispute resolution hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Team,
});

function Team() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: roles = [] } = useQuery(rolesQuery);
  const isAdmin = roles.some((r) => r.user_id === user?.id && r.role === "admin");

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delError) throw delError;
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="rule-label">Access control</p>
        <h1 className="mt-1 text-3xl font-semibold">Team &amp; roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin
            ? "Admins can change roles. Investigators manage cases; viewers have read access."
            : "Only admins can change roles."}
        </p>
      </div>

      <div className="panel divide-y divide-border">
        {profiles.map((p) => {
          const role = roles.find((r) => r.user_id === p.id)?.role ?? "viewer";
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-48 flex-1">
                <p className="text-sm font-medium">{p.full_name || p.email}</p>
                <p className="text-xs text-muted-foreground">{p.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">Joined {formatDate(p.created_at)}</span>
              {isAdmin ? (
                <Select
                  value={role}
                  onValueChange={(v) => setRole.mutate({ userId: p.id, role: v })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">{role}</Badge>
              )}
            </div>
          );
        })}
        {profiles.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No staff accounts yet.</p>
        )}
      </div>
    </div>
  );
}
