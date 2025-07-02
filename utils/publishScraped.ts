import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

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

export async function publishScraped(specifiedId?: number){
  // Use service role key to bypass RLS when inserting into community_post
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
  const { data: post } = specifiedId
    ? await admin.from('scraped_posts').select('*').eq('id', specifiedId).maybeSingle()
    : await admin.from("scraped_posts").select("*").eq("used",false).order("score",{ascending:false}).limit(1).maybeSingle();
  if (!post) {
    if (!specifiedId){
      try {
        const { runAllScrapers } = await import("@/utils/scrapers");
        await runAllScrapers();
      } catch (e) {
        console.log("runAllScrapers error", e);
      }
      const { data: fresh } = await admin.from("scraped_posts").select("*").eq("used", false).order("score", { ascending: false }).limit(1).maybeSingle();
      if (!fresh) return { skip: true };
      return await publishScraped(); // 재귀 한번
    }
    return { skip:true };
  }

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
  // 콘텐츠가 비어 있으면 요약을 보조로 사용
  if (!content.trim()) {
    content = post.summary || "";
  }
  // 그래도 비어 있으면 제목을 내용에 포함하여 최소한 텍스트가 보이도록 처리
  if (!content.trim()) {
    content = title;
  }

  // -------------------
  // Paraphrase 단계 (Replicate API 사용 – 존재할 때만)
  // -------------------

  async function paraphrase(text: string, maxTokens = 120) {
    const repToken = process.env.REPLICATE_API_TOKEN;
    if (!repToken) return text;

    try {
      // 모델 버전 캐시 또는 최신 버전 검색
      let repVersion = process.env.REPLICATE_MODEL_VERSION;
      if (!repVersion || repVersion.length < 40) {
        const latestJson: any = await fetch("https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct", {
          headers: { Authorization: `Token ${repToken}` },
        }).then((r) => r.json());
        repVersion = latestJson?.latest_version?.id;
      }

      if (!repVersion) return text;

      const startRes = await fetch(`https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct/versions/${repVersion}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Token ${repToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt: `다음 글을 자연스러운 한국어 커뮤니티 말투로 2~3문장, 최대 120자 이내로 재구성해라.\n\n[원문]\n${text}\n\n[재구성]`,
            max_tokens: maxTokens,
            temperature: 0.9,
            top_p: 0.9,
          },
        }),
      });

      if (!startRes.ok) return text;
      let repJson: any = await startRes.json();
      let wait = 0;
      while (repJson?.status && repJson.status !== "succeeded" && repJson.status !== "failed" && wait < 10) {
        await new Promise((r) => setTimeout(r, 2000));
        repJson = await fetch(`https://api.replicate.com/v1/predictions/${repJson.id}`, {
          headers: { Authorization: `Token ${repToken}` },
        }).then((r) => r.json());
        wait += 1;
      }
      if (repJson.status !== "succeeded") return text;
      const out = repJson?.output?.join ? repJson.output.join("") : repJson.output || "";
      return out.replace(/\n+/g, " ").trim() || text;
    } catch (e) {
      console.log("paraphrase error", e);
      return text;
    }
  }

  // 제목과 내용에 각색 적용
  title = await paraphrase(title, 40);
  content = await paraphrase(content, 60);

  // 글자 수 60자 이내 + 줄바꿈 0~1회 제한
  content = content.replace(/\n+/g, " \n ").trim();
  if (content.length > 60) {
    content = content.slice(0, 57) + "…";
  }

  // 5-1) 제목에서 이모지 및 특수 패턴 제거
  // 간단 이모지 제거 – 유니코드 범위로 필터 (고정폭 surrogate 영역)
  const emojiRegex = /[\u2190-\u21FF\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g;
  title = title.replace(emojiRegex, "").trim();

  // 이미지 전용 패턴(P1/P4)의 경우 캡션을 1줄 이하로 유지
  if ((pattern === "P1" || pattern === "P4") && content.includes("<img")) {
    const parts = content.split("\n");
    content = parts[0]; // 이미지 태그만 남김
  }

  const { data: inserted, error } = await admin.from("community_post").insert({
    title,
    content,
    user_id: null,
    likes:0,
    is_ai_generated: false,
    created_at: new Date().toISOString(),
  }).select('id').single();
  if (error) throw error;

  // Mark as used only after successful insert
  await admin.from("scraped_posts").update({ used: true }).eq("id", post.id);

  // -------- AI 댓글 자동 생성 (비동기, 실패 무시) --------
  try {
    const port = process.env.PORT || '3000';
    await fetch(`http://127.0.0.1:${port}/api/ai-generate-comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: inserted?.id })
    });
  } catch(e){ console.log('auto comment error',e);}

  return { ok: true, id: post.id };
} 