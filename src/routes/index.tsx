import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, FolderOpen, Gavel, BookOpen } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Central hub for logging, investigating and resolving internal disputes — case board, hearing schedule, appeals and resolution resources.",
      },
      { property: "og:title", content: "Internal Dispute Resolution Hub" },
      {
        property: "og:description",
        content:
          "Track disputes from submission through hearing, appeal and closure, with policies and templates in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const pillars = [
  {
    icon: FolderOpen,
    title: "Case board",
    body: "Every dispute logged with a case number, filing party, department, owner and priority.",
  },
  {
    icon: Gavel,
    title: "Stage tracking",
    body: "New Submission, In Progress, Hearing Scheduled, Appeal Filed and Closed — with a full note trail.",
  },
  {
    icon: BookOpen,
    title: "Resource library",
    body: "Policies, intake forms, hearing guidelines and checklists migrated from the existing board.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-ink text-ink-foreground">
              <Scale className="size-4" />
            </span>
            <span className="font-display text-sm font-semibold">IDR Hub</span>
          </div>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Staff sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="rule-label">Internal use only</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl">
          Internal Dispute Resolution Hub
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Welcome to the centralized hub for managing eXp agent-to-agent disputes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/submit/hearing-request"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            File a hearing request
          </Link>
          <Link
            to="/submit/response"
            className="rounded-md border border-input bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Submit a response
          </Link>
          <Link
            to="/submit/appeal"
            className="rounded-md border border-input bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Request an appeal
          </Link>
          <Link
            to="/auth"
            className="rounded-md border border-input bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Staff: open the case board
          </Link>
        </div>
        <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
          Complaining agents use the hearing request form. Respondents use the response form. Appeals
          of a hearing outcome use the appeal request form. All land in the review queue for
          Regulatory Relations.
        </p>



        <div className="mt-20 grid gap-5 sm:grid-cols-3">
          {pillars.map((p) => (
            <article key={p.title} className="panel p-6">
              <p.icon className="size-5 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
          Confidential — dispute records are restricted to authorized staff.
        </p>
      </footer>
    </div>
  );
}
