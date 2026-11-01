import { z } from 'zod';

export const STAGE_EMAIL_SENDER = 'regulatoryrelations@exprealty.net';
export type EmailMatter = { id: string; title: string; complainant_email: string | null; respondent_email: string | null; mb_dmb_email: string | null };
export function stageEmail(matter: EmailMatter, stage: string, investigatorEmail: string | null, origin: string, responseDue: string | null) {
  const valid = (value: string | null) => z.string().email().safeParse(value?.trim()).success;
  if (!valid(matter.complainant_email) || !valid(matter.mb_dmb_email)) throw new Error('Add valid complainant and MB/DMB email addresses before sending.');
  const receipt = stage === 'New Submission';
  if (!receipt && (!valid(matter.respondent_email) || !valid(investigatorEmail))) throw new Error('Add a valid respondent email and assign an investigator with an email before sending.');
  const unique = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => Boolean(v)).map(v => v.trim().toLowerCase()))];
  const to = receipt ? unique([matter.complainant_email, matter.mb_dmb_email]) : unique([matter.respondent_email]);
  const cc = receipt ? [] : unique([matter.complainant_email, investigatorEmail, matter.mb_dmb_email]).filter(v => !to.includes(v));
  const body = stage === 'New Submission'
    ? `Your internal dispute hearing request has been received by Regulatory Relations and will be reviewed. Receipt does not confirm eligibility or a hearing date.`
    : stage === 'In Progress'
    ? 'Regulatory Relations has begun reviewing this matter and preparing the pre-hearing checklist. This status update does not start the respondent defense deadline. A separate invitation will provide response instructions.'
    : `You are invited to submit your defense paperwork and signed Internal Dispute Resolution Binding Agreement. The governing SOP provides 10 calendar days from invitation sending.${responseDue ? ` Your recorded response deadline is ${new Date(responseDue).toUTCString()}.` : ' Your exact deadline will be recorded after this invitation is accepted for sending.'}\n\nResponse form: ${origin}/submit/response\nBinding agreement: https://docs.google.com/document/d/11pPjmcg3pgPi3lWGeKjuVmjDDkfe-fwNSdmnGxSYD-U/edit?tab=t.0\nUse the names of both agents from the complaint when completing your response.`;
  return { to, cc, subject: `Internal Dispute Resolution — ${matter.title} — ${stage}`, body: `Case: ${matter.title}\n\n${body}\n\nMatter: ${origin}/cases/${matter.id}\nCase access requires an authorized portal account.\n\nRegulatory Relations\n${STAGE_EMAIL_SENDER}` };
}

export function rawStageEmail(message: ReturnType<typeof stageEmail>) {
  const encode = (value: string) => btoa(Array.from(new TextEncoder().encode(value), byte => String.fromCharCode(byte)).join(''));
  const raw = [`From: Regulatory Relations <${STAGE_EMAIL_SENDER}>`, `Reply-To: ${STAGE_EMAIL_SENDER}`, `To: ${message.to.join(', ')}`, ...(message.cc.length ? [`Cc: ${message.cc.join(', ')}`] : []), `Subject: =?UTF-8?B?${encode(message.subject)}?=`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', '', message.body].join('\r\n');
  return encode(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}