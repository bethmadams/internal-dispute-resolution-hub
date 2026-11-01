import { test, expect } from "bun:test";
import { buildHubMessage, HUB_CONVERSATION_ID, hubPortalOrigin, isHubSubmission, isHubReminderDue } from "./hub-notify";

test("Hub permits only the three new form submission kinds", () => {
  for (const kind of ["hearing_request", "response", "appeal"]) expect(isHubSubmission(kind)).toBe(true);
  for (const kind of ["case_update", "note", "workflow_update", "reminder", "unknown"]) expect(isHubSubmission(kind)).toBe(false);
});

test("Hub reminders wait until their notification time and exclude completed reminders", () => {
  const now = Date.parse("2026-11-01T03:20:00Z");
  expect(isHubReminderDue({ done: false, remind_at: "2026-11-01T03:21:00Z" }, now)).toBe(false);
  expect(isHubReminderDue({ done: false, remind_at: "2026-11-01T03:20:00Z" }, now)).toBe(true);
  expect(isHubReminderDue({ done: false, remind_at: "2026-11-01T03:19:00Z" }, now)).toBe(true);
  expect(isHubReminderDue({ done: true, remind_at: "2026-11-01T03:19:00Z" }, now)).toBe(false);
});

test("Hub links use a public origin instead of localhost", () => {
  expect(hubPortalOrigin(new URL("https://localhost:8080"))).toBe("https://id-preview--a4df2ad6-9251-478e-bd1c-f847920075df.lovable.app");
  expect(hubPortalOrigin(new URL("https://portal.example/cases/a"))).toBe("https://portal.example");
});

test("Hub messages preserve the IDR channel, investigator mention and matter link", () => {
  const mention = { userId: "anna-test", displayName: "Anna Luedke", username: "annaluedke" };
  const message = buildHubMessage({ kind: "hearing_request", title: "New hearing request submitted", state: "Arizona", caseName: "Smith v. Jones", caseUrl: "https://portal.example/cases/example", investigatorName: "Anna Luedke", mention });
  expect(message.conversation_id).toBe(HUB_CONVERSATION_ID);
  expect(message.mentions).toEqual([mention]);
  expect(message.content).toContain("@annaluedke");
  expect(message.content).toContain("https://portal.example/cases/example");
  expect(message.content).toContain("Case: Smith v. Jones");
  expect(message.content).not.toContain("IDR-");
});