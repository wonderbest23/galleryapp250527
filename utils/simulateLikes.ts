import { createClient } from "@supabase/supabase-js";

const WINDOW_HOURS = 24;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function rand(min:number,max:number){return Math.floor(Math.random()*(max-min+1))+min;}

function targetLikes(views:number){
  const perc = Math.random()*0.008 + 0.002; // 0.2% ~ 1%
  return Math.max(1, Math.floor(views*perc));
}

export async function simulateLikes(){
  const since = new Date(Date.now()-WINDOW_HOURS*60*60*1000).toISOString();
  const { data:posts, error } = await admin
    .from("community_post")
    .select("id, views, likes, created_at")
    .gte("created_at", since);
  if(error) throw error;
  if(!posts?.length) return { skipped:true };

  for(const p of posts){
    const tgt = targetLikes(p.views||0);
    if((p.likes||0) >= tgt) continue;

    const prob = p.views>=2000?0.9:(p.views>=500?0.6:0.3);
    if(Math.random()>prob) continue;

    const remaining = tgt - (p.likes||0);
    const inc = Math.min(remaining, rand(1,3));
    await admin.from("community_post").update({likes:(p.likes||0)+inc}).eq("id",p.id);
  }
  return { processed: posts.length };
} 