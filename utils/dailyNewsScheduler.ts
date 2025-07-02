import { createClient } from "@supabase/supabase-js";
import { eachMinuteOfInterval } from "date-fns";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function randomTimes(count:number){
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start.getTime()+24*60*60*1000-60*1000);
  const minutes = eachMinuteOfInterval({start,end});
  return minutes.sort(()=>Math.random()-0.5).slice(0,count);
}

export async function scheduleDailyNews(prompt:string){
  const times = randomTimes(30);
  await supa.from("ai_post_schedules").insert({
    name:`daily-news-${new Date().toISOString().slice(0,10)}`,
    mode:"ai",
    auto_publish:true,
    enabled:true,
    prompt_template:prompt,
    run_at_list:times
  });
} 