import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchArtHeadlines } from "@/utils/fetchArtNews";
import fetch from "node-fetch";

// POST /api/ai-generate-post
// Body: { scheduleId?: string, prompt?: string, autoPublish?: boolean }

export async function POST(req: NextRequest) {
  try {
    const { prompt, scheduleId, autoPublish = false } = await req.json();

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      console.log("HF_TOKEN env 가 필요합니다.");
      return NextResponse.json({ error: "missing-hf-token" }, { status: 500 });
    }

    // 기본 프롬프트 템플릿
    const basePrompt =
      prompt ||
      "너는 현대·클래식 미술 전문 큐레이터 겸 칼럼니스트다. 사람처럼 자연스러운 한국어로 400~600자 분량의 컬럼을 작성해라.";

    // 최신 미술 헤드라인 삽입
    const headlines = await fetchArtHeadlines();
    const newsSection = headlines.length
      ? `\n\n[오늘의 미술 헤드라인]\n${headlines
          .map((h, i) => `${i + 1}. ${h}`)
          .join("\n")}\n\n`
      : "";

    const finalPrompt = basePrompt + newsSection;

    // 1) HuggingFace Inference API 호출 (Flan-T5 Large 예시)
    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-large",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: finalPrompt }),
      },
    );

    if (!hfRes.ok) {
      console.log("HF API error", await hfRes.text());
      return NextResponse.json({ error: "hf-error" }, { status: 500 });
    }

    const hfJson: any = await hfRes.json();
    const rawText = hfJson?.[0]?.generated_text || "";

    // 2) 간단 후처리 – 제목과 본문 분리 규칙: 첫 줄을 제목으로 간주
    const [firstLine, ...restLines] = rawText.split("\n").filter(Boolean);
    const title = firstLine.replace(/^#*/g, "").trim();
    const content = restLines.join("\n").trim();

    // 3) Supabase insert (draft)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            /* no-op */
          },
        },
      },
    );

    const { data, error } = await supabase.from("ai_post_drafts").insert({
      schedule_id: scheduleId ?? null,
      title,
      content,
      tags: [],
      status: autoPublish ? "published" : "draft",
      published_at: autoPublish ? new Date().toISOString() : null,
    }).select("id, status, title").single();

    if (error) {
      console.log("DB insert error", error);
      return NextResponse.json({ error: "db-error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (e: any) {
    console.log("ai-generate-post error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
} 