import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// POST /api/ai-generate-post
// Body: { scheduleId?: string, prompt?: string, autoPublish?: boolean }

export async function POST(req: NextRequest) {
  try {
    const { prompt, scheduleId, autoPublish = false } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      console.log("OPENAI_API_KEY 가 설정되어 있지 않습니다.");
      return NextResponse.json({ error: "missing-openai-key" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 기본 프롬프트(예시) – 실제 서비스에서는 schedule 테이블에서 읽어온 템플릿과 병합
    const finalPrompt =
      prompt ||
      "너는 현대·클래식 미술 전문 큐레이터 겸 칼럼니스트다. 사람처럼 자연스러운 한국어로 400~600자 분량의 컬럼을 작성해라.";

    // 1) GPT 호출
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 사용 가능한 모델로 교체 가능
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content:
            "너는 현대·클래식 미술 전문 큐레이터 겸 칼럼니스트다. 독자에게 친근하면서도 전문적인 톤으로 작성해라.",
        },
        { role: "user", content: finalPrompt },
      ],
    });

    const rawText = chat.choices[0]?.message?.content ?? "";

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