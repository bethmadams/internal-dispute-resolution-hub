import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
export type Task = Database['public']['Tables']['case_tasks']['Row'];
export type Workflow = Database['public']['Tables']['case_workflow']['Row'];
export type Panelist = Database['public']['Tables']['case_panelists']['Row'];
export type Communication = Database['public']['Tables']['case_communications']['Row'];
export type Audit = Database['public']['Tables']['case_audit']['Row'];
export function workflowQuery(caseId: string) {
  return { queryKey: ['case_workflow',caseId], queryFn: async () => {
    const result = await supabase.from('case_workflow').select('*').eq('dispute_id',caseId).maybeSingle();
    if(result.error) throw result.error; return result.data;
  }};
}
export function tasksQuery(caseId?: string) {
  return { queryKey: ['case_tasks',caseId ?? 'all'], queryFn: async () => {
    let query = supabase.from('case_tasks').select('*').order('created_at');
    if(caseId) query = query.eq('dispute_id',caseId);
    const result=await query; if(result.error) throw result.error; return result.data ?? [];
  }};
}
export function panelQuery(caseId: string) {
  return { queryKey: ['case_panelists',caseId], queryFn: async () => {
    const r=await supabase.from('case_panelists').select('*').eq('dispute_id',caseId).order('created_at'); if(r.error) throw r.error; return r.data ?? [];
  }};
}
export function communicationsQuery(caseId: string) {
  return { queryKey: ['case_communications',caseId], queryFn: async () => {
    const r=await supabase.from('case_communications').select('*').eq('dispute_id',caseId).order('created_at',{ascending:false}); if(r.error) throw r.error; return r.data ?? [];
  }};
}
export function auditQuery(caseId: string) {
  return { queryKey: ['case_audit',caseId], queryFn: async () => {
    const r=await supabase.from('case_audit').select('*').eq('dispute_id',caseId).order('created_at',{ascending:false}).limit(200); if(r.error) throw r.error; return r.data ?? [];
  }};
}
export function saveFile(contents: string, name: string, type: string) {
  const url=URL.createObjectURL(new Blob([contents],{type}));
  const link=document.createElement('a'); link.href=url; link.download=name; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}