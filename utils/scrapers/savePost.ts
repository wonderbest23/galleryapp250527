// Supabase 저장 및 이미지 업로드를 위한 순수 서버사이드 헬퍼
// Next.js 의 Request/Response 컨텍스트(쿠키 스토어)에 의존하지 않도록
// service-role 키로 직접 초기화된 클라이언트를 사용한다.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fetch from "node-fetch";

// 서비스 롤 키는 RLS 를 우회하여 INSERT/UPLOAD 이 가능하도록 해준다.
const admin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const BUCKET = "scraped-images";

export async function uploadImageToStorage(url: string): Promise<string|null> {
  if(!url) return null;
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const resized = await sharp(buf).resize({ width: 800 }).jpeg().toBuffer();

    const filePath = `ai/${Date.now()}-${Math.round(Math.random()*1e6)}.jpg`;
    const { error } = await admin.storage.from(BUCKET).upload(filePath, resized, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if(error){ console.log("storage upload error", error); return null; }
    const { data } = admin.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch(e){ console.log("uploadImage error", e); return null; }
}

export async function saveScrapedPost(params:{source:string,post_url:string,title:string,thumb_url?:string,summary?:string,score?:number}){
  console.log('saveScrapedPost', params.title);

  // 상대경로일 경우 post_url 기준으로 절대주소 생성
  let finalThumb = params.thumb_url || null;
  if (finalThumb && finalThumb.startsWith('/')) {
    try {
      const abs = new URL(finalThumb, params.post_url).href;
      finalThumb = abs;
    } catch {}
  }

  if (finalThumb && !finalThumb.includes('supabase.co')) {
    try {
      const uploaded = await uploadImageToStorage(finalThumb);
      if (uploaded) finalThumb = uploaded;
    } catch(e){ console.log('uploadImageToStorage error',e); }
  }

  const { error } = await admin.from("scraped_posts").insert({
    source: params.source,
    post_url: params.post_url,
    title: params.title,
    thumb_url: finalThumb,
    summary: params.summary || null,
    score: params.score ?? 0,
  });

  // 중복 URL(UNIQUE 제약 없을 경우)로 인한 23505 오류 무시
  if (error && (error.code === "23505" || error.message?.includes("duplicate"))) {
    console.log("scraped_posts duplicate ignored", params.post_url);
    return;
  }
  if (error) {
    console.log("scraped_posts insert error", error);
  }
} 