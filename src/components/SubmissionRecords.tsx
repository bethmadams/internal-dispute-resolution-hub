import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ErrorBoundary } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { canReadSubmissionCopies, type SubmissionType } from "@/lib/submission-copy";
import { readSubmissionCopies } from "@/lib/submission-copy.functions";

export function SubmissionRecords({ type }: { type: SubmissionType }) {
  const { user } = useCurrentUser();
  if (!user) return null;
  return <ErrorBoundary errorComponent={() => <p role="alert" className="mt-8 text-sm text-muted-foreground">External submission records are unavailable. Original submissions remain on the Case Board.</p>}>
    <Suspense fallback={<p className="mt-8 text-sm text-muted-foreground">Loading submissions…</p>}>
      <StaffRecords type={type} userId={user.id} />
    </Suspense>
  </ErrorBoundary>;
}

function StaffRecords({ type, userId }: { type: SubmissionType; userId: string }) {
  const { data: roles } = useSuspenseQuery({
    queryKey: ['submission-record-access', userId],
    queryFn: async () => {
      const result = await supabase.from('user_roles').select('role').eq('user_id', userId);
      if (result.error) throw result.error;
      return (result.data ?? []).map((r) => r.role);
    },
  });
  if (!canReadSubmissionCopies(roles)) return null;
  return <RecordsTable type={type} userId={userId} />;
}

function RecordsTable({ type, userId }: { type: SubmissionType; userId: string }) {
  const read = useServerFn(readSubmissionCopies);
  const { data } = useSuspenseQuery({ queryKey: ['external-submissions', userId, type], queryFn: () => read({ data: { type } }) });
  return <section className="mt-10 border-t border-border pt-6">
    <h2 className="text-lg font-semibold">Submitted {type === 'hearing_request' ? 'hearing requests' : type === 'hearing_response' ? 'hearing responses' : 'appeals'}</h2>
    {data.warning && <p role="status" className="mt-3 text-sm text-muted-foreground">{data.warning}</p>}
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-border"><th className="p-3">Submitted by</th><th className="p-3">State</th><th className="p-3">Date</th><th className="p-3">Summary</th></tr></thead>
        <tbody>{data.rows.map((row) => <tr key={row.id} className="border-b border-border"><td className="p-3 align-top">{row.submitted_by}</td><td className="p-3 align-top">{row.state ?? '—'}</td><td className="p-3 align-top">{row.submitted_on}</td><td className="max-w-80 whitespace-normal break-words p-3 align-top">{row.summary}</td></tr>)}</tbody>
      </table>
      {!data.rows.length && <p className="py-6 text-sm text-muted-foreground">No submissions copied yet.</p>}
    </div>
  </section>;
}