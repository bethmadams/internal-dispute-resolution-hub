import {useEffect,useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {supabase} from '@/integrations/supabase/client';
import {dispatchStageEmail} from '@/lib/stage-email.functions';

export function StageEmailDispatcher() {
  const dispatch = useServerFn(dispatchStageEmail);
  const busy = useRef(false);
  const {data,refetch} = useQuery({queryKey:['pending-stage-emails'],queryFn:async()=>{const {data,error}=await supabase.from('stage_email_queue').select('id').eq('status','pending').order('created_at').limit(5);if(error) return [];return data ?? [];},refetchInterval:30000});
  useEffect(()=>{if(!data?.length || busy.current)return;busy.current=true;void (async()=>{try{for(const row of data) await dispatch({data:{id:row.id}});}catch{/* queue retains failures */}finally{busy.current=false;void refetch();}})();},[data,dispatch,refetch]);
  return null;
}