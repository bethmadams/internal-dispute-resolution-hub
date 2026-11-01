import { test, expect } from "bun:test";
import { buildHubMessage, HUB_CONVERSATION_ID } from "./hub-notify";

test("Hub messages preserve the IDR channel, investigator mention and matter link", () => {
  const mention = { userId: "anna-test", displayName: "Anna Luedke", username: "annaluedke" };
  const message = buildHubMessage({ kind: "hearing_request", title: "Smith v. Jones", state: "Arizona", caseNumber: "IDR-2026-001", caseUrl: "https://portal.example/cases/example", investigatorName: "Anna Luedke", mention });
  expect(message.conversation_id).toBe(HUB_CONVERSATION_ID);
  expect(message.mentions).toEqual([mention]);
  expect(message.content).toContain("@annaluedke");
  expect(message.content).toContain("https://portal.example/cases/example");
});