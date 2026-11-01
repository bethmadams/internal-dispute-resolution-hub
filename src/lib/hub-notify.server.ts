// Server-only Hub API calls. Never import from client code.
import { HUB_API_BASE, type HubMention, type HubMessage } from "./hub-notify";

type HubUserSearchResult = HubMention | null;

function toMention(raw: unknown): HubUserSearchResult {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const userId = (r["id"] ?? r["user_id"] ?? r["userId"]) as
    | string
    | undefined;
  if (!userId) return null;
  const displayName = (r["display_name"] ??
    r["full_name"] ??
    r["name"] ??
    r["email"] ??
    "Hub user") as string;
  const username = (r["username"] ?? r["handle"] ?? displayName) as string;
  return { userId, displayName, username };
}

export async function searchHubUser(
  email: string,
  key: string,
): Promise<HubUserSearchResult> {
  const url = `${HUB_API_BASE}/api/v1/users/search?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, {
    headers: { "x-api-key": key },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const body: unknown = await res.json().catch(() => null);
  if (Array.isArray(body)) return toMention(body[0]);
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (Array.isArray(b["users"])) return toMention(b["users"][0]);
    if (Array.isArray(b["data"])) return toMention(b["data"][0]);
    return toMention(b);
  }
  return null;
}

export async function sendHubMessage(
  key: string,
  message: HubMessage,
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch(`${HUB_API_BASE}/api/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { ok: true, status: res.status };
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: text.slice(0, 300) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}
