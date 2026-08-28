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

  const { data: invites = [] } = useQuery(invitesQuery);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("investigator");

  const addInvite = useMutation({
    mutationFn: async () => {
      const email = inviteEmail.trim().toLowerCase();
      if (!email || !email.includes("@")) throw new Error("Enter a valid email address");
      const { error } = await supabase.from("team_invites").insert({
        email,
        full_name: inviteName.trim() || null,
        role: inviteRole as "admin",
        invited_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite added — share the sign-up link with them");
      setInviteEmail("");
      setInviteName("");
      queryClient.invalidateQueries({ queryKey: ["team_invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_invites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite removed");
      queryClient.invalidateQueries({ queryKey: ["team_invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signupLink =
    typeof window !== "undefined" ? `${window.location.origin}/auth` : "/auth";

  const pendingInvites = invites.filter((i) => !i.accepted_at);


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

      {isAdmin && (
        <div className="panel p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="rule-label">Invitations</p>
              <h2 className="mt-1 text-xl font-semibold">Add a team member</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pre-assign a role by email. When they register at the sign-up link, they get that
                role automatically.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(signupLink);
                toast.success("Sign-up link copied");
              }}
            >
              Copy sign-up link
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@exprealty.net"
              />
            </div>
            <div className="min-w-40 flex-1">
              <label className="text-xs text-muted-foreground">Name (optional)</label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
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
            </div>
            <Button onClick={() => addInvite.mutate()} disabled={addInvite.isPending}>
              {addInvite.isPending ? "Adding…" : "Add invite"}
            </Button>
          </div>

          <div className="mt-5 divide-y divide-border border-t border-border">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-48 flex-1">
                  <p className="text-sm font-medium">{invite.full_name || invite.email}</p>
                  <p className="text-xs text-muted-foreground">{invite.email}</p>
                </div>
                <Badge variant="outline">{invite.role}</Badge>
                <span className="text-xs text-muted-foreground">
                  Invited {formatDate(invite.created_at)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInvite.mutate(invite.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
            {pendingInvites.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">No pending invites.</p>
            )}
          </div>
        </div>
      )}

      <TerritoryRouting canEdit={isAdmin} />
    </div>
  );
}

