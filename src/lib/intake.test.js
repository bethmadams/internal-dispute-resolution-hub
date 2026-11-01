import { describe, expect, mock, test } from 'bun:test';
mock.module('@/integrations/supabase/client', () => ({ supabase: {} }));
const { hearingRequestSchema, responseFormSchema, appealRequestSchema } = await import('./intake');

describe('MB/DMB contact on submission forms', () => {
  for (const [name, schema] of [['hearing request', hearingRequestSchema], ['response', responseFormSchema], ['appeal', appealRequestSchema]]) {
    test(`${name} retains a valid MB/DMB email and rejects invalid addresses`, () => {
      const contact = schema.pick({ mb_dmb_email: true });
      expect(contact.parse({ mb_dmb_email: ' broker@example.com ' }).mb_dmb_email).toBe('broker@example.com');
      expect(contact.safeParse({ mb_dmb_email: 'not-an-email' }).success).toBe(false);
      expect(contact.safeParse({ mb_dmb_email: '' }).success).toBe(true);
    });
    test(`${name} retains the MB/DMB name`, () => {
      expect(schema.pick({ mb_dmb_name: true }).parse({ mb_dmb_name: ' Morgan Broker ' }).mb_dmb_name).toBe('Morgan Broker');
    });
  }
});