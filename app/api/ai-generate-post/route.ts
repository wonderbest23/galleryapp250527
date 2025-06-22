import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchArtHeadlines } from "@/utils/fetchArtNews";
import fetch from "node-fetch";

// POST /api/ai-generate-post
// Body: { scheduleId?: string, prompt?: string, autoPublish?: boolean }

export async function POST(req: NextRequest) {
  // verify service role key presence
  console.log("SERVICE_KEY?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { prompt, scheduleId, autoPublish = false } = await req.json();

    const repToken = process.env.REPLICATE_API_TOKEN;
    if (!repToken) {
      console.log("REPLICATE_API_TOKEN env 가 필요합니다.");
      return NextResponse.json({ error: "missing-replicate-token" }, { status: 500 });
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

    // 1) Replicate API 호출
    let repVersion = process.env.REPLICATE_MODEL_VERSION;

    // env 가 없거나 40~64자 해시가 아닌 경우 최신 버전 조회
    if (!repVersion || repVersion.length < 40) {
      try {
        const latestRes = await fetch("https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct", {
          headers: { Authorization: `Token ${repToken}` },
        });
        const latestJson: any = await latestRes.json();
        repVersion = latestJson?.latest_version?.id;
        console.log("Fetched latest repVersion", repVersion);
      } catch (e) {
        console.log("fetch latest version error", e);
      }
      if (!repVersion) {
        return NextResponse.json({ error: "missing-replicate-version" }, { status: 500 });
      }
    }

    const repRes = await fetch(`https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct/versions/${repVersion}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Token ${repToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: finalPrompt,
          max_tokens: 400,
        },
      }),
    });

    if (!repRes.ok) {
      console.log("Replicate API error", await repRes.text());
      return NextResponse.json({ error: "replicate-error" }, { status: 500 });
    }

    let repJson: any = await repRes.json();

    // 작업이 완료될 때까지 최대 20초(2000ms * 10) 동안 폴링
    let waitCount = 0;
    while (repJson?.status && repJson.status !== "succeeded" && repJson.status !== "failed" && waitCount < 10) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${repJson.id}`, {
        headers: {
          Authorization: `Token ${repToken}`,
          "Content-Type": "application/json",
        },
      });
      repJson = await pollRes.json();
      waitCount += 1;
    }

    if (repJson.status !== "succeeded") {
      console.log("Replicate prediction not succeeded", repJson);
      return NextResponse.json({ error: "replicate-processing" }, { status: 500 });
    }

    const rawText = repJson?.output?.join ? repJson.output.join("") : repJson.output || "";

    // 2) 간단 후처리 – 제목과 본문 분리 규칙: 첫 줄을 제목으로 간주
    const [firstLine, ...restLines] = rawText.split("\n").filter(Boolean);
    const title = firstLine.replace(/^#*/g, "").trim();
    const content = restLines.join("\n").trim();

    // 3) Supabase insert (draft) - use admin client with service_role key (RLS 우회)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
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