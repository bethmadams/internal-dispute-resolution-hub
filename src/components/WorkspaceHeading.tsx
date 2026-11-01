import type { ReactNode } from "react";

export function WorkspaceHeading({ eyebrow, title, detail, children }: { eyebrow: string; title: string; detail?: string; children?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
    <div><p className="rule-label">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold">{title}</h1>{detail && <p className="mt-2 text-sm text-muted-foreground">{detail}</p>}</div>
    {children}
  </div>;
}