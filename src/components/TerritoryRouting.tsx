import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Territory = {
  state: string;
  investigator_name: string;
  investigator_email: string | null;
};

export function TerritoryRouting({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["territory_assignments"],
    queryFn: async (): Promise<Territory[]> => {
      const { data, error } = await supabase
        .from("territory_assignments")
        .select("state, investigator_name, investigator_email")
        .order("state");
      if (error) throw error;
      return data ?? [];
    },
  });

  const groups = rows.reduce<Record<string, Territory[]>>((acc, row) => {
    (acc[row.investigator_name] ??= []).push(row);
    return acc;
  }, {});

  const [emails, setEmails] = useState<Record<string, string>>({});
  useEffect(() => {
    setEmails((prev) => {
      const next = { ...prev };
      for (const [name, list] of Object.entries(groups)) {
        if (next[name] === undefined) next[name] = list[0]?.investigator_email ?? "";
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const saveEmail = useMutation({
    mutationFn: async (name: string) => {
      const email = (emails[name] ?? "").trim().toLowerCase();
      const { error } = await supabase
        .from("territory_assignments")
        .update({ investigator_email: email || null })
        .eq("investigator_name", name);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Territory routing updated");
      queryClient.invalidateQueries({ queryKey: ["territory_assignments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Territory routing</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        New submissions are auto-assigned to the investigator who covers the state where the
        issue occurred. Routing only works once the investigator's email matches an account here.
      </p>

      <div className="mt-4 space-y-5">
        {Object.entries(groups).map(([name, list]) => (
          <div key={name} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{list.length} states</p>
              </div>
              <div className="min-w-56 flex-1">
                <label className="text-xs text-muted-foreground">Account email</label>
                <Input
                  type="email"
                  disabled={!canEdit}
                  value={emails[name] ?? ""}
                  onChange={(e) => setEmails((p) => ({ ...p, [name]: e.target.value }))}
                  placeholder="name@exprealty.net"
                />
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => saveEmail.mutate(name)}
                  disabled={saveEmail.isPending}
                >
                  Save
                </Button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {list.map((t) => (
                <Badge key={t.state} variant="secondary" className="font-normal">
                  {t.state}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
