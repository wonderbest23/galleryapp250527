import { createClient } from "@/utils/supabase/server";

const patterns = [
  { id: "P1", weight: 40 },
  { id: "P2", weight: 30 },
  { id: "P3", weight: 20 },
  { id: "P4", weight: 10 },
];
function pickPattern(){
  const total = patterns.reduce((a,b)=>a+b.weight,0);
  const rnd = Math.random()*total;
  let acc=0;
  for(const p of patterns){acc+=p.weight;if(rnd<=acc) return p.id;}
  return "P1";
}

export async function publishScraped(){
  const admin = await createClient();
  const { data: post } = await admin.from("scraped_posts").select("*").eq("used",false).order("score",{ascending:false}).limit(1).maybeSingle();
  if(!post) return { skip:true };

  let title = post.title;
  let content="";
  const pattern = pickPattern();
  switch(pattern){
    case "P1":
      content = post.thumb_url ? `<img src="${post.thumb_url}" class="w-full rounded-md mb-2" />` : "";
      break;
    case "P2":
      content = (post.thumb_url?`<img src="${post.thumb_url}" class="w-full mb-2" />\n` : "") + (post.summary||"");
      break;
    case "P3":
      title = title.replace(/\[.*?\]/g,"");
      content = post.summary||"";
      break;
    case "P4":
      content = post.thumb_url?`<img src="${post.thumb_url}" class="w-full rounded-md mb-2" />\n<img src="${post.thumb_url}" class="w-full rounded-md mb-2" />`:"";
      break;
  }
  if(post.post_url){
    content += `\n\n<a href="${post.post_url}" class="text-xs text-gray-400" target="_blank" rel="noopener">출처</a>`;
  }

  const { error } = await admin.from("community_post").insert({
    title,
    content,
    user_id: null,
    likes:0,
    is_ai_generated: false,
    created_at: new Date().toISOString(),
  });
  if(error) throw error;
  await admin.from("scraped_posts").update({ used: true }).eq("id", post.id);
  return { ok:true, id: post.id };
} 