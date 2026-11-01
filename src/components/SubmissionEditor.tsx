import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMyRole } from '@/hooks/use-role';
import { submissionFields, submissionChanges, type SubmissionKind } from '@/lib/submission-edit';
import { APPELLANT_ROLES, DISPUTE_REASONS, CODE_OF_ETHICS_ARTICLES, US_STATES } from '@/lib/intake';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SubmissionEditor({ kind, record }: { kind: SubmissionKind; record: { id: string; updated_at: string } }) {
  const { isAdmin } = useMyRole();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [original, setOriginal] = useState<Record<string, unknown>>({});
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const update = (key: string, value: unknown) => setDraft(prev => ({ ...prev, [key]: value }));
  const save = useMutation({
    mutationFn: async () => {
      const values = submissionChanges(kind, original, draft);
      if (!Object.keys(values).length) return;
      const result = await supabase.rpc('edit_submitted_form', { _kind: kind, _id: record.id, _expected_updated_at: String(original['updated_at']), _values: values });
      if (result.error) throw result.error;
    },
    onSuccess: () => { setOpen(false); toast.success('Submission updated'); for (const key of ['dispute','disputes','dispute_responses','dispute_appeals','case_audit','case-progress','submission-edit-history']) void queryClient.invalidateQueries({ queryKey: [key] }); },
    onError: (e: Error) => setError(e.message),
  });
  if (!isAdmin) return null;
  return <Dialog open={open} onOpenChange={value => { if (!save.isPending) setOpen(value); }}>
    <Button variant="outline" size="sm" onClick={() => { const initial = { ...record }; setOriginal(initial); setDraft(initial); setError(''); setOpen(true); }}><Pencil className="size-4" />Edit {kind === 'hearing_request' ? 'hearing request' : kind}</Button>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Edit {kind === 'hearing_request' ? 'hearing request' : kind === 'response' ? 'hearing response' : 'appeal request'}</DialogTitle><DialogDescription>Update submitted information. Existing attachments and case stage are retained; original external submission copies remain unchanged.</DialogDescription></DialogHeader>
      <form onSubmit={event => { event.preventDefault(); setError(''); save.mutate(); }}>
        <fieldset disabled={save.isPending} className="grid min-w-0 gap-4 sm:grid-cols-2">
          {submissionFields[kind].map(field => {
            const value = draft[field.key];
            const id = `edit-${kind}-${field.key}`;
            const options = field.type === 'state' ? US_STATES : field.type === 'role' ? APPELLANT_ROLES : [];
            return <div key={field.key} className={`min-w-0 space-y-2 ${['textarea','reasons','articles'].includes(field.type) ? 'sm:col-span-2' : ''}`}>
              <Label htmlFor={id}>{field.label}</Label>
              {field.type === 'textarea' ? <Textarea id={id} value={String(value ?? '')} maxLength={field.max} rows={3} onChange={e => update(field.key,e.target.value)} />
              : ['state','role','boolean'].includes(field.type) ? <Select value={field.type === 'boolean' ? value === true ? 'yes' : value === false ? 'no' : 'unset' : String(value || 'unset')} onValueChange={v => update(field.key,field.type === 'boolean' ? v === 'unset' ? null : v === 'yes' : v === 'unset' ? null : v)}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unset">Not provided</SelectItem>{field.type === 'boolean' ? <><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></> : options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
              : ['reasons','articles'].includes(field.type) ? <div className="grid gap-2 sm:grid-cols-2">{(field.type === 'reasons' ? DISPUTE_REASONS : CODE_OF_ETHICS_ARTICLES).map(option => { const selected = Array.isArray(value) ? value : String(value ?? '').split(',').map(v => v.trim()).filter(Boolean); return <Label key={option} className="flex items-start gap-2 text-sm font-normal"><Checkbox checked={selected.includes(option)} onCheckedChange={checked => { const next = checked ? [...selected,option] : selected.filter(v => v !== option); update(field.key,field.type === 'reasons' ? next : next.join(', ')); }} />{option}</Label>; })}</div>
              : <Input id={id} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'} min={field.type === 'number' ? 0 : undefined} step={field.type === 'number' ? '0.01' : undefined} maxLength={field.max} value={String(value ?? '')} onChange={e => update(field.key,e.target.value)} />}
            </div>;
          })}
        </fieldset>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <DialogFooter className="mt-6"><Button type="button" variant="outline" disabled={save.isPending} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={save.isPending}><Save className="size-4" />{save.isPending ? 'Saving…' : 'Save changes'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}