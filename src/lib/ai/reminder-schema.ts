import { z } from "zod";
export const reminderSuggestionSchema = z.object({
  body: z.string().min(1),
  dueLocal: z.string().nullable(),
  leadMinutes: z.number().int(),
  explanation: z.string(),
  clarification: z.string().nullable(),
}).strict();
export type ReminderSuggestion = z.infer<typeof reminderSuggestionSchema>;