import { createClient } from "@supabase/supabase-js";
import { publishScraped } from "./publishScraped";
import { markUsed } from "./scheduleGenerator";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken:false, persistSession:false } },
);

export async function runPublisher(){
  const { data } = await admin
    .from('scheduled_posts')
    .select('id, scraped_id')
    .eq('published', false)
    .lte('publish_at', new Date().toISOString())
    .limit(10);

  if(!data?.length) return;
  for(const row of data){
    await publishScraped(row.scraped_id);
    await admin.from('scheduled_posts').update({published:true}).eq('id', row.id);
    await markUsed(row.scraped_id);
  }
  console.log('[publisher] published', data.length);
} 