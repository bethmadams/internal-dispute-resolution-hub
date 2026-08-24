import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-session";
import { rolesQuery } from "@/lib/hub";

export const Route = createFileRoute("/_authenticated/admin-resources")({
  head: () => ({
    meta: [
      { title: "Admin Resources | Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Standard operating procedure and submission guidelines for admin personnel running the internal dispute resolution process.",
      },
      { property: "og:title", content: "Admin Resources | Internal Dispute Resolution Hub" },
      {
        property: "og:description",
        content: "SOP and submission guidelines for dispute resolution admin personnel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminResources,
});

const PAGES = [
  {
    title: "Internal Dispute SOP",
    url: "https://docs.google.com/document/d/1RQntasVV_wc52iDF6r1Ekd2xeztKJJxU80s57uY6ixE/edit?tab=t.0",
    notes: [
      "This Internal Dispute Hearing SOP is intended to assist staff and panelists in making the process accessible to all agents. The ideal goal is to create a welcoming professional environment free of intimidation and bias. Each step in the proceedings should be smooth and transparent enabling trust and integrity to be evident to all those who participate.",
    ],
  },
  {
    title: "Submission Guidelines",
    url: "https://docs.google.com/document/d/1hPGtOKhnPEFi3sTrDRQ_ZlYK5-QIaInfYMknznMT__8/edit?tab=t.0",
    notes: [
      "Before any matters are submitted to Internal Dispute Resolution, the DMB/MB must exhaust other efforts through in-state mediation to resolve the matter. To avoid any confusion, the Internal Dispute Resolution should be considered a last resort, not an early intervention option.",
      "Before the Internal Dispute Resolution process is deployed, the DMB/MB must discuss the matter with the Regional Director to ensure other internal avenues have been used to resolve the matter.",
      "Prior to submitting a matter, during the Mediation process, the DMB/MB must inform both disputing parties that the Internal Dispute Resolution is absolutely voluntary and the parties are NOT obligated to participate.",
    ],
    lists: [
      {
        heading: "What is submittable",
        items: [
          "Commission disputes between two active agents licensed within the eXp Realty brokerages (eXp Realty, eXp Commercial and eXp Referral) only",
          "NAR Code of Ethics violations",
          "Commercial real estate ethics violations",
          "Arbitration",
        ],
      },
      {
        heading: "What is not permissible",
        items: [
          "Agents who are no longer licensed with eXp",
          "Employees of eXp are not permitted to participate",
          "Team agreements and mentor/mentee relationships",
          "Matters relating to a transaction will not be heard during an active pending transaction",
        ],
      },
    ],
  },
];

function AdminResources() {
  const { user } = useCurrentUser();
  const { data: roles } = useQuery(rolesQuery);
  const isAdmin = roles?.some((r) => r.user_id === user?.id && r.role === "admin") ?? false;

  return (
    <div className="space-y-8">
      <div>
        <p className="rule-label">Admin personnel</p>
        <h1 className="mt-1 text-3xl font-semibold">Admin resources</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Operating procedure and intake criteria for staff administering the internal dispute
          resolution process.
        </p>
      </div>

      {!isAdmin && (
        <div className="panel flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>
            These materials are maintained for admin personnel. You can read them, but edits are
            managed by an administrator.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {PAGES.map((page) => (
          <article key={page.title} className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-xl font-semibold">{page.title}</h2>
              <a
                href={page.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open document <ExternalLink className="size-3.5" />
              </a>
            </div>
            <div className="mt-4 space-y-3">
              {page.notes.map((n) => (
                <p key={n.slice(0, 24)} className="text-sm leading-relaxed text-muted-foreground">
                  {n}
                </p>
              ))}
            </div>
            {page.lists && (
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {page.lists.map((list) => (
                  <div key={list.heading}>
                    <p className="rule-label">{list.heading}</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      {list.items.map((i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-accent">•</span>
                          <span>{i}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
