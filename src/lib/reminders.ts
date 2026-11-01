import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
export const remindersQuery = queryOptions({
  queryKey: ["personal_reminders"],
  queryFn: async () => {
    const { data, error } = await supabase.from("personal_reminders").select("*").order("remind_at");
    if (error) throw error;
    return data ?? [];
  },
  refetchInterval: 60000,
});
export async function saveReminder(action: string, data: Json) {
  const result = await supabase.rpc("save_personal_reminder", { _action: action, _data: data });
  if (result.error) throw result.error;
  return result.data;
}