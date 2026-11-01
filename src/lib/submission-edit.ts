import { z } from 'zod';

export type SubmissionKind = 'hearing_request' | 'response' | 'appeal';
type FieldType = 'text' | 'email' | 'date' | 'textarea' | 'state' | 'boolean' | 'number' | 'reasons' | 'articles' | 'role';
export type SubmissionField = { key: string; label: string; type: FieldType; max?: number };
const broker: SubmissionField[] = [{ key: 'mb_dmb_name', label: 'MB/DMB name', type: 'text', max: 120 }, { key: 'mb_dmb_email', label: 'MB/DMB email', type: 'email' }];
export const submissionFields: Record<SubmissionKind, SubmissionField[]> = {
  hearing_request: [
    { key: 'filed_by', label: 'Complainant name', type: 'text', max: 120 }, { key: 'complainant_email', label: 'Complainant email', type: 'email' },
    ...broker, { key: 'respondent', label: 'Respondent name', type: 'text', max: 120 }, { key: 'respondent_email', label: 'Respondent email', type: 'email' },
    { key: 'respondent_phone', label: 'Respondent phone', type: 'text', max: 40 }, { key: 'respondent_active', label: 'Respondent active with eXp', type: 'boolean' },
    { key: 'state', label: 'State where the issue occurred', type: 'state' }, { key: 'department', label: 'Department', type: 'text', max: 120 },
    { key: 'filed_at', label: 'Submission date', type: 'date' }, { key: 'description', label: 'Facts of the issue', type: 'textarea', max: 6000 },
    { key: 'reasons', label: 'Reasons for complaint', type: 'reasons' }, { key: 'ethics_articles', label: 'Code of Ethics articles cited', type: 'articles' },
    { key: 'seeking', label: 'What the complainant is seeking', type: 'textarea', max: 2000 }, { key: 'steps_taken', label: 'Steps taken to remedy', type: 'textarea', max: 2000 },
    { key: 'property_address', label: 'Property address', type: 'text', max: 300 }, { key: 'closing_date', label: 'Closing date', type: 'date' },
    { key: 'involves_money', label: 'Monetary amount involved', type: 'boolean' }, { key: 'monetary_amount', label: 'Monetary amount', type: 'number' },
    { key: 'additional_comments', label: 'Additional comments', type: 'textarea', max: 2000 },
  ],
  response: [{ key: 'responder_name', label: 'Respondent name', type: 'text', max: 120 }, { key: 'responder_email', label: 'Respondent email', type: 'email' }, ...broker,
    { key: 'submitted_on', label: 'Submission date', type: 'date' }, { key: 'state', label: 'State where the issue occurred', type: 'state' },
    { key: 'responding_to_name', label: 'Complainant name', type: 'text', max: 120 }, { key: 'summary', label: 'Response to complaint', type: 'textarea', max: 6000 },
    { key: 'additional_comments', label: 'Additional comments', type: 'textarea', max: 2000 }],
  appeal: [{ key: 'appellant_name', label: 'Appellant name', type: 'text', max: 120 }, { key: 'appellant_email', label: 'Appellant email', type: 'email' }, ...broker,
    { key: 'appellant_role', label: 'Appellant role', type: 'role' }, { key: 'submitted_on', label: 'Submission date', type: 'date' },
    { key: 'state', label: 'State where the issue occurred', type: 'state' }, { key: 'hearing_date', label: 'Hearing date', type: 'date' },
    { key: 'new_evidence', label: 'New evidence', type: 'textarea', max: 6000 }],
};
export function canEditSubmissions(roles: string[]) { return roles.includes('admin'); }
export function submissionChanges(kind: SubmissionKind, original: Record<string, unknown>, draft: Record<string, unknown>) {
  const changes: Record<string, string | number | boolean | null | string[]> = {};
  for (const field of submissionFields[kind]) {
    const raw = draft[field.key];
    if (JSON.stringify(raw) === JSON.stringify(original[field.key])) continue;
    let value: string | number | boolean | null | string[];
    if (field.type === 'reasons') value = z.array(z.string()).parse(raw);
    else if (field.type === 'boolean') value = z.boolean().nullable().parse(raw);
    else if (field.type === 'number') value = raw === '' || raw == null ? null : z.number().finite().nonnegative().parse(Number(raw));
    else {
      const text = String(raw ?? '').trim();
      if (field.type === 'email' && text) z.string().email(`Enter a valid ${field.label.toLowerCase()}`).max(255).parse(text);
      if (field.type === 'date' && text && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text)) || new Date(text).toISOString().slice(0,10) !== text)) throw new Error(`${field.label} must be a valid date`);
      if (field.max && text.length > field.max) throw new Error(`${field.label} is too long`);
      if (['filed_at','submitted_on','appellant_name','appellant_role','appellant_email','responder_name','summary','new_evidence'].includes(field.key) && !text) throw new Error(`${field.label} cannot be blank`);
      value = text || null;
    }
    changes[field.key] = value;
  }
  return changes;
}