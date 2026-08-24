import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, IntakeShell } from "@/components/IntakeShell";
import { BINDING_AGREEMENT_NOTE, responseFormSchema, uploadIntakeFiles } from "@/lib/intake";

export const Route = createFileRoute("/submit/response")({
  head: () => ({
    meta: [
      { title: "Hearing Response Form | Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Respondents submit their narrative response, signed binding agreement and supporting documentation to an internal dispute complaint.",
      },
      { property: "og:title", content: "Hearing Response Form | Internal Dispute Resolution Hub" },
      {
        property: "og:description",
        content:
          "Reply to an internal dispute complaint — your response is logged for the review panel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResponseForm,
});

type Errors = Record<string, string>;

function ResponseForm() {
  const [done, setDone] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [agreement, setAgreement] = useState<File[]>([]);
  const [supporting, setSupporting] = useState<File[]>([]);
  const [form, setForm] = useState({
    submitted_by: "",
    email: "",
    submission_date: new Date().toISOString().slice(0, 10),
    state: "",
    responding_to: "",
    summary: "",
    additional_comments: "",
  });

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = responseFormSchema.safeParse(form);
      if (!parsed.success) {
        const next: Errors = {};
        for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
        setErrors(next);
        throw new Error("Please correct the highlighted fields.");
      }
      if (agreement.length === 0) {
        setErrors({ agreement: "The signed binding agreement is required." });
        throw new Error("Please attach the signed binding agreement.");
      }
      setErrors({});
      const v = parsed.data;
      const responseId = crypto.randomUUID();

      const agreementFiles = await uploadIntakeFiles(`responses/${responseId}`, agreement);
      const supportingFiles = await uploadIntakeFiles(`responses/${responseId}`, supporting);

      const { error } = await supabase.from("dispute_responses").insert({
        id: responseId,
        dispute_id: null,
        responder_name: v.submitted_by,
        responder_email: v.email || null,
        submitted_on: v.submission_date,
        state: v.state,
        responding_to_name: v.responding_to || null,
        summary: v.summary,
        additional_comments: v.additional_comments || null,
      });
      if (error) throw error;

      const rows = [
        ...agreementFiles.map((f) => ({ ...f, kind: "binding_agreement", response_id: responseId })),
        ...supportingFiles.map((f) => ({ ...f, kind: "supporting", response_id: responseId })),
      ];
      if (rows.length) {
        const { error: attErr } = await supabase.from("dispute_attachments").insert(rows);
        if (attErr) throw attErr;
      }
      return v.submitted_by;
    },
    onSuccess: (name) => setDone(name),
    onError: (e: Error) => toast.error(e.message),
  });

  if (done) {
    return (
      <IntakeShell
        eyebrow="Submitted"
        title="Your response has been received"
        intro={`Thank you, ${done}. Your response has been logged and attached to the review queue for the panel.`}
      >
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          Return to the hub
        </Link>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell
      eyebrow="Respondent"
      title="Hearing Response Form"
      intro="Complete this form if a complaint has been filed against you. Your response is recorded alongside the original submission for the review panel."
    >
      <div className="panel space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Submitted by (full name)" required error={errors['submitted_by']}>
            <Input
              value={form.submitted_by}
              onChange={(e) => set("submitted_by", e.target.value)}
            />
          </Field>
          <Field label="Your email address" error={errors['email']}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Submission date" required error={errors['submission_date']}>
            <Input
              type="date"
              value={form.submission_date}
              onChange={(e) => set("submission_date", e.target.value)}
            />
          </Field>
          <Field label="State where the issue occurred" required error={errors['state']}>
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
          </Field>
        </div>

        <div className="space-y-5 border-t border-border pt-6">
          <Field
            label="Responding to complaint submitted by (name of the other agent)"
            error={errors['responding_to']}
          >
            <Input
              value={form.responding_to}
              onChange={(e) => set("responding_to", e.target.value)}
            />
          </Field>
          <Field label="Summary of your response" required error={errors['summary']}>
            <Textarea rows={6} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>
          <Field label="Additional comments">
            <Textarea
              rows={3}
              value={form.additional_comments}
              onChange={(e) => set("additional_comments", e.target.value)}
            />
          </Field>
        </div>

        <div className="space-y-5 border-t border-border pt-6">
          <Field
            label="Signed binding agreement"
            required
            hint={BINDING_AGREEMENT_NOTE}
            error={errors['agreement']}
          >
            <Input
              type="file"
              multiple
              onChange={(e) => setAgreement(Array.from(e.target.files ?? []))}
            />
          </Field>
          <Field
            label="Narrative response and supporting documentation"
            hint="Attach your written response and any supporting documents (20MB per file)."
          >
            <Input
              type="file"
              multiple
              onChange={(e) => setSupporting(Array.from(e.target.files ?? []))}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-6">
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit response"}
          </Button>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5" /> Confidential — reviewed by Regulatory Relations
            only
          </span>
        </div>
      </div>
    </IntakeShell>
  );
}
