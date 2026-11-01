import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";

type Props = {
  table: "disputes" | "dispute_responses" | "dispute_appeals";
  id: string;
  label: string;
  returnToBoard?: boolean;
};

export function DeleteCard({ table, id, label, returnToBoard = false }: Props) {
  const { isAdmin } = useMyRole();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const deletion = useMutation({
    mutationFn: async () => {
      if (!isAdmin) throw new Error("Only admins can delete cards.");
      // The database's admin-only DELETE policy is the security boundary.
      const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Card not found or deletion is not permitted.");
    },
    onSuccess: async () => {
      setOpen(false);
      toast.success("Card deleted");
      if (returnToBoard) await navigate({ to: "/dashboard" });
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (!isAdmin) return null;
  return (
    <>
      <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" title={`Delete ${label}`} aria-label={`Delete ${label}`} onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={(value) => { if (!deletion.isPending) setOpen(value); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              {label} will be permanently removed from the portal. This cannot be undone.
              {table === "disputes" ? " Case notes, document links, and assigned-user access will also be removed. Linked responses and appeals are retained as unmatched submissions." : " Its document links will also be removed. The associated case will not be deleted."}
              {" Copies already saved in the external database and stored files are not deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" disabled={deletion.isPending} onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deletion.isPending} onClick={() => deletion.mutate()}>{deletion.isPending ? "Deleting…" : "Delete card"}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}