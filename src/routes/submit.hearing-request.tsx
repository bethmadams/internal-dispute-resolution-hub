import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, IntakeShell, StateSelect } from "@/components/IntakeShell";
import {
  BINDING_AGREEMENT_NOTE,
  BINDING_AGREEMENT_URL,
  CODE_OF_ETHICS_ARTICLES,
  DISPUTE_REASONS,
  hearingRequestSchema,
  uploadIntakeFiles,
} from "@/lib/intake";

export const Route = createFileRoute("/submit/hearing-request")({
  head: () => ({
    meta: [
      { title: "Internal Dispute Resolution Hearing Request" },
      {
        name: "description",
        content:
          "Agents file an internal dispute resolution hearing request: parties involved, facts, remedy sought and supporting documentation.",
      },
      { property: "og:title", content: "Internal Dispute Resolution Hearing Request" },
      {
        property: "og:description",
        content:
          "Submit a hearing request as the complaining agent — your case is logged as a new submission for review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HearingRequest,
});

type Errors = Record<string, string>;

function HearingRequest() {
  const [done, setDone] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [agreement, setAgreement] = useState<File[]>([]);
  const [supporting, setSupporting] = useState<File[]>([]);
  const [form, setForm] = useState({
    submission_date: new Date().toISOString().slice(0, 10),
    submitted_by: "",
    email: "",
    state: "",
    other_agent: "",
    other_agent_email: "",
    other_agent_phone: "",
    other_agent_active: "",
    reasons: [] as string[],
    ethics_articles: "",
    summary: "",
    seeking: "",
    steps_taken: "",
    property_address: "",
    closing_date: "",
    involves_money: "",
    monetary_amount: "",
    additional_comments: "",
  });

  const ineligible = form.other_agent_active === "no";

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleReason = (reason: string) =>
    setForm((f) => ({
      ...f,
      reasons: f.reasons.includes(reason)
        ? f.reasons.filter((r) => r !== reason)
        : [...f.reasons, reason],
    }));

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = hearingRequestSchema.safeParse(form);
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
      const disputeId = crypto.randomUUID();

      const agreementFiles = await uploadIntakeFiles(`disputes/${disputeId}`, agreement);
      const supportingFiles = await uploadIntakeFiles(`disputes/${disputeId}`, supporting);

      const { error } = await supabase.from("disputes").insert({
        id: disputeId,
        case_number: "",
        title: `${v.reasons[0]} — ${v.submitted_by} v. ${v.other_agent}`,
        description: v.summary,
        filed_by: v.submitted_by,
        complainant_email: v.email,
        respondent: v.other_agent,
        respondent_email: v.other_agent_email,
        respondent_phone: v.other_agent_phone || null,
        respondent_active: v.other_agent_active === "yes",
        state: v.state,
        reasons: v.reasons,
        ethics_articles: v.ethics_articles || null,
        seeking: v.seeking,
        steps_taken: v.steps_taken,
        property_address: v.property_address || null,
        closing_date: v.closing_date || null,
        involves_money: v.involves_money === "yes",
        monetary_amount: v.monetary_amount ? Number(v.monetary_amount.replace(/[^0-9.]/g, "")) : null,
        additional_comments: v.additional_comments || null,
        filed_at: v.submission_date,
        stage: "New Submission" as const,
        source: "public_form",
        created_by: null,
      });
      if (error) throw error;

      const rows = [
        ...agreementFiles.map((f) => ({ ...f, kind: "binding_agreement", dispute_id: disputeId })),
        ...supportingFiles.map((f) => ({ ...f, kind: "supporting", dispute_id: disputeId })),
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
        title="Your hearing request has been received"
        intro={`Thank you, ${done}. Your request has been logged as a new submission and Regulatory Relations will review it and follow up by email.`}
      >
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          Return to the hub
        </Link>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell
      eyebrow="Complaining agent"
      title="Internal Dispute Resolution Hearing Request"
      intro="Complete this form to request an internal dispute resolution hearing. Fields marked with an asterisk are required. Your submission goes straight to the review queue as a new submission."
    >
      <div className="panel space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Submission date" required error={errors['submission_date']}>
            <Input
              type="date"
              value={form.submission_date}
              onChange={(e) => set("submission_date", e.target.value)}
            />
          </Field>
          <Field label="State where the issue occurred" required error={errors['state']}>
            <StateSelect value={form.state} onChange={(v) => set("state", v)} />
          </Field>
          <Field label="Submitted by (full name)" required error={errors['submitted_by']}>
            <Input
              value={form.submitted_by}
              onChange={(e) => set("submitted_by", e.target.value)}
            />
          </Field>
          <Field label="Your email address" required error={errors['email']}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </div>

        <div className="border-t border-border pt-6">
          <p className="rule-label">Other agent (respondent)</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Name of other agent" required error={errors['other_agent']}>
              <Input
                value={form.other_agent}
                onChange={(e) => set("other_agent", e.target.value)}
              />
            </Field>
            <Field label="Email of other agent" required error={errors['other_agent_email']}>
              <Input
                type="email"
                value={form.other_agent_email}
                onChange={(e) => set("other_agent_email", e.target.value)}
              />
            </Field>
            <Field label="Phone number of other agent" error={errors['other_agent_phone']}>
              <Input
                value={form.other_agent_phone}
                onChange={(e) => set("other_agent_phone", e.target.value)}
              />
            </Field>
            <Field
              label="Is the other agent active with eXp?"
              required
              error={errors['other_agent_active']}
            >
              <Select
                value={form.other_agent_active}
                onValueChange={(v) => set("other_agent_active", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {ineligible && (
            <Alert variant="destructive" className="mt-5">
              <AlertCircle className="size-4" />
              <AlertTitle>Not eligible for a hearing</AlertTitle>
              <AlertDescription>
                This dispute is not eligible for a hearing because the other agent is not active with eXp.
                Internal Dispute Resolution is only available for disputes between active eXp agents.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {!ineligible && (
          <>
            <div className="border-t border-border pt-6">
              <Field
                label="Reason for requesting an internal dispute hearing"
                required
                hint="Select all that apply."
                error={errors['reasons']}
              >
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {DISPUTE_REASONS.map((reason) => (
                    <label key={reason} className="flex items-start gap-2.5 text-sm">
                      <Checkbox
                        checked={form.reasons.includes(reason)}
                        onCheckedChange={() => toggleReason(reason)}
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </Field>
              {form.reasons.includes("REALTOR Code of Ethics complaint") && (
                <div className="mt-5">
                  <Field label="Which Articles of the Code of Ethics?">
                    <Select
                      value={form.ethics_articles}
                      onValueChange={(v) => set("ethics_articles", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an article" />
                      </SelectTrigger>
                      <SelectContent>
                        {CODE_OF_ETHICS_ARTICLES.map((article) => (
                          <SelectItem key={article} value={article}>
                            {article}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </div>

            <div className="space-y-5 border-t border-border pt-6">
              <Field label="General facts / summary of the issue" required error={errors['summary']}>
                <Textarea rows={6} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
              </Field>
              <Field label="What are you seeking?" required error={errors['seeking']}>
                <Textarea rows={3} value={form.seeking} onChange={(e) => set("seeking", e.target.value)} />
              </Field>
              <Field
                label="Steps taken to remedy thus far"
                required
                error={errors['steps_taken']}
              >
                <Textarea
                  rows={3}
                  value={form.steps_taken}
                  onChange={(e) => set("steps_taken", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
              <Field label="Property address, if applicable">
                <Input
                  value={form.property_address}
                  onChange={(e) => set("property_address", e.target.value)}
                />
              </Field>
              <Field label="Date sale/lease/referral closed or is scheduled to close">
                <Input
                  type="date"
                  value={form.closing_date}
                  onChange={(e) => set("closing_date", e.target.value)}
                />
              </Field>
              <Field
                label="Does this complaint involve a monetary amount?"
                required
                error={errors['involves_money']}
              >
                <Select value={form.involves_money} onValueChange={(v) => set("involves_money", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select yes or no" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.involves_money === "yes" && (
                <Field label="Monetary amount involved">
                  <Input
                    value={form.monetary_amount}
                    onChange={(e) => set("monetary_amount", e.target.value)}
                    placeholder="e.g. 12500"
                  />
                </Field>
              )}
            </div>

            <div className="space-y-5 border-t border-border pt-6">
              <Field
                label="Signed binding agreement"
                required
                hint={BINDING_AGREEMENT_NOTE}
                error={errors['agreement']}
              >
                <a
                  href={BINDING_AGREEMENT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-3 inline-flex items-center text-sm font-medium text-primary underline underline-offset-4"
                >
                  Download the Binding Agreement Form
                </a>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setAgreement(Array.from(e.target.files ?? []))}
                />
              </Field>
              <Field
                label="Complaint and supporting documentation"
                hint="Attach any documents that support your complaint (20MB per file)."
              >
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setSupporting(Array.from(e.target.files ?? []))}
                />
              </Field>
              <Field label="Additional comments">
                <Textarea
                  rows={3}
                  value={form.additional_comments}
                  onChange={(e) => set("additional_comments", e.target.value)}
                />
              </Field>
            </div>

            <div className="flex items-center gap-3 border-t border-border pt-6">
              <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                {submit.isPending ? "Submitting…" : "Submit hearing request"}
              </Button>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3.5" /> Confidential — reviewed by Regulatory Relations
                only
              </span>
            </div>
          </>
        )}
      </div>
    </IntakeShell>
  );
}
