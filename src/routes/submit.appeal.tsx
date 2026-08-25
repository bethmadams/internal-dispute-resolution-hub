import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, IntakeShell, StateSelect } from "@/components/IntakeShell";
import { APPELLANT_ROLES, appealRequestSchema, uploadIntakeFiles } from "@/lib/intake";

export const Route = createFileRoute("/submit/appeal")({
  head: () => ({
    meta: [
      { title: "Appeal Request Form | Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Appeal the outcome of an internal dispute resolution hearing by submitting new evidence and supporting documents for panel review.",
      },
      { property: "og:title", content: "Appeal Request Form | Internal Dispute Resolution Hub" },
      {
        property: "og:description",
        content:
          "Submit an appeal of an internal dispute hearing decision, including the new evidence being offered.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppealForm,
});

type Errors = Record<string, string>;

function AppealForm() {
  const [done, setDone] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [documents, setDocuments] = useState<File[]>([]);
  const [form, setForm] = useState({
    submitted_by: "",
    submission_date: new Date().toISOString().slice(0, 10),
    appellant_role: "",
    state: "",
    email: "",
    hearing_date: "",
    new_evidence: "",
  });

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = appealRequestSchema.safeParse(form);
      if (!parsed.success) {
        const next: Errors = {};
        for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
        setErrors(next);
        throw new Error("Please correct the highlighted fields.");
      }
      setErrors({});
      const v = parsed.data;
      const appealId = crypto.randomUUID();

      const files = await uploadIntakeFiles(`appeals/${appealId}`, documents);

      const { error } = await supabase.from("dispute_appeals").insert({
        id: appealId,
        dispute_id: null,
        appellant_name: v.submitted_by,
        appellant_role: v.appellant_role,
        appellant_email: v.email,
        state: v.state || null,
        hearing_date: v.hearing_date,
        new_evidence: v.new_evidence,
        submitted_on: v.submission_date,
      });
      if (error) throw error;

      if (files.length) {
        const { error: attErr } = await supabase.from("dispute_attachments").insert(
          files.map((f) => ({ ...f, kind: "appeal_evidence", appeal_id: appealId })),
        );
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
        title="Your appeal request has been received"
        intro={`Thank you, ${done}. Your appeal and any documents you attached have been logged for Regulatory Relations review.`}
      >
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          Return to the hub
        </Link>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell
      eyebrow="Appeal"
      title="Appeal Request"
      intro="Use this form to appeal the outcome of an internal dispute resolution hearing. An appeal must present new evidence that was not available to the original panel."
    >
      <div className="panel space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Submitted by (full name)" required error={errors['submitted_by']}>
            <Input
              value={form.submitted_by}
              onChange={(e) => set("submitted_by", e.target.value)}
            />
          </Field>
          <Field label="Submission date" required error={errors['submission_date']}>
            <Input
              type="date"
              value={form.submission_date}
              onChange={(e) => set("submission_date", e.target.value)}
            />
          </Field>
          <Field label="Are you" required error={errors['appellant_role']}>
            <Select
              value={form.appellant_role}
              onValueChange={(value) => set("appellant_role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role in the dispute" />
              </SelectTrigger>
              <SelectContent>
                {APPELLANT_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="State where the issue occurred" error={errors['state']}>
            <StateSelect value={form.state} onChange={(v) => set("state", v)} />
          </Field>
          <Field label="Your email address" required error={errors['email']}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Internal dispute hearing date" required error={errors['hearing_date']}>
            <Input
              type="date"
              value={form.hearing_date}
              onChange={(e) => set("hearing_date", e.target.value)}
            />
          </Field>
        </div>

        <div className="space-y-5 border-t border-border pt-6">
          <Field label="What new evidence is being submitted?" required error={errors['new_evidence']}>
            <Textarea
              rows={6}
              value={form.new_evidence}
              onChange={(e) => set("new_evidence", e.target.value)}
            />
          </Field>
          <Field
            label="Upload additional documents"
            hint="Attach any documents supporting the new evidence (20MB per file)."
          >
            <Input
              type="file"
              multiple
              onChange={(e) => setDocuments(Array.from(e.target.files ?? []))}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-6">
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit appeal request"}
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
