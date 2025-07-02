import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function weight(h:number){
  // Gaussian-like weight: peak at 18h, minimal at night
  const exponent = -Math.pow(h - 18, 2) / 8;
  return Math.max(0, Math.round(10 * Math.exp(exponent) + Math.random()));
}

export async function generateScheduleForToday(){
  const today = new Date(); today.setMinutes(0,0,0);
  const publishes:{scraped_id:number,publish_at:string}[] = [];

  const { data: pool } = await admin.from('scraped_posts').select('id').eq('used',false).limit(500);
  if(!pool?.length) return;
  let idx = 0;
  for(let h=0;h<24;h++){
    const n = weight(h);
    for(let i=0;i<n && idx<pool.length;i++){
      const base = new Date(today); base.setHours(h);
      base.setMinutes(Math.floor(Math.random()*60));
      base.setSeconds(Math.floor(Math.random()*60));
      publishes.push({ scraped_id: pool[idx++].id, publish_at: base.toISOString() });
    }
  }
  if(publishes.length){
    await admin.from('scheduled_posts').insert(publishes);
    console.log('[scheduleGenerator] queued', publishes.length);
  }
}

export async function markUsed(id:number){
  await admin.from('scraped_posts').update({used:true}).eq('id',id);
} 