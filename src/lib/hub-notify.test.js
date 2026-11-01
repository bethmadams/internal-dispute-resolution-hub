import { test, expect } from "bun:test";
import { buildHubMessage, HUB_CONVERSATION_ID, hubPortalOrigin } from "./hub-notify";

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