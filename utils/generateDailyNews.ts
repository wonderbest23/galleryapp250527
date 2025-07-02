import { createClient } from "@supabase/supabase-js";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function generateDailyNews() {
  // 1) 최신 scraped_posts 60개 수집
  const { data } = await supa
    .from("scraped_posts")
    .select("title, summary")
    .order("created_at", { ascending: false })
    .limit(60);

  if (!data?.length) throw new Error("no-scraped-posts");

  const lines = data.slice(0, 30).map((p, i) => `${i + 1}. ${p.title} — ${p.summary ?? ""}`);

  const prompt = `너는 한국어 문화·예술 전문 기자다.\n아래 [자료]를 참고해 최신 미술·전시 뉴스 30개를 작성해라.\n\n형식: 제목↵본문 (400~600자, 3문단, 존댓말, 마지막 마침표)\n규칙: 1) AI·챗봇·모델 언급 금지 2) 1인칭 금지 3) 사실 변형 금지 4) 인용문은 "…" 사용\n\n[자료]\n${lines.join("\n")}`;

  // 2) 내부 호출로 ai-generate-post 실행 (autoPublish true)
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"}/api/ai-generate-post`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, autoPublish: true }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ai-generate-post error ${txt}`);
  }
  return await res.json();
} 