// eXp Hub (hub.exprealty.com) notification constants and message builders.
// Client-safe: no secrets here. The API key is read server-side only.

export const HUB_API_BASE =
  "https://oklnqysblyswhbfxurby.supabase.co/functions/v1/hub-api";

// "Internal Dispute Resolution Notification" Hub channel.
export const HUB_CONVERSATION_ID = "f07d027f-7bb7-4327-9b81-8f0a5e5b076f";

export function hubPortalOrigin(requestUrl: URL): string {
  return ["localhost", "127.0.0.1", "[::1]"].includes(requestUrl.hostname)
    ? "https://id-preview--a4df2ad6-9251-478e-bd1c-f847920075df.lovable.app"
    : requestUrl.origin;
}

export type HubMention = {
  userId: string;
  displayName: string;
  username: string;
};

export type HubMessage = {
  conversation_id: string;
  content: string;
  mentions?: HubMention[];
};

const HUB_KIND_LABELS: Record<string, string> = {
  hearing_request: "New hearing request",
  response: "New hearing response",
  appeal: "New appeal request",
  case_update: "Case update",
  note: "Case note added",
  workflow_update: "Case workflow update",
};

export function hubKindLabel(kind: string): string {
  return HUB_KIND_LABELS[kind] ?? "Case update";
}

export function buildHubMessage(opts: {
  kind: string;
  title: string;
  state: string | null;
  caseNumber: string | null;
  caseUrl: string | null;
  investigatorName: string | null;
  mention: HubMention | null;
}): HubMessage {
  const lines = [
    "Internal Dispute Resolution Notification",
    `Notification type: ${hubKindLabel(opts.kind)}`,
    "",
    [opts.caseNumber, opts.title, opts.state ? `(${opts.state})` : null]
      .filter(Boolean)
      .join(" - "),
  ];
  if (opts.mention) {
    lines.push(
      "",
      `Assigned investigator: @${opts.mention.username} (${opts.mention.displayName})`,
    );
  } else if (opts.investigatorName) {
    lines.push("", `Assigned investigator: ${opts.investigatorName}`);
  }
  if (opts.caseUrl) {
    lines.push("", `View the matter: ${opts.caseUrl}`);
  }
  const message: HubMessage = {
    conversation_id: HUB_CONVERSATION_ID,
    content: lines.join("\n"),
  };
  if (opts.mention) message.mentions = [opts.mention];
  return message;
}
