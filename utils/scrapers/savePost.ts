import { createClient } from "@/utils/supabase/server";
import sharp from "sharp";
import fetch from "node-fetch";

const BUCKET = "scraped-images";

export async function uploadImageToStorage(url: string): Promise<string|null> {
  if(!url) return null;
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const resized = await sharp(buf).resize({ width: 800 }).jpeg().toBuffer();

    const supabase = await createClient();
    const filePath = `ai/${Date.now()}-${Math.round(Math.random()*1e6)}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, resized, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if(error){ console.log("storage upload error", error); return null; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch(e){ console.log("uploadImage error", e); return null; }
}

export async function saveScrapedPost(params:{source:string,post_url:string,title:string,thumb_url?:string,summary?:string,score?:number}){
  const supabase = await createClient();
  const { error } = await supabase.from("scraped_posts").upsert({
    ...params,
    thumb_url: params.thumb_url || null,
    summary: params.summary || null,
    score: params.score ?? 0,
  }).eq("post_url", params.post_url);
  if(error){ console.log("scraped_posts upsert error", error); }
} 