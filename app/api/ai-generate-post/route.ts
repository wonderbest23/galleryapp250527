import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchArtHeadlines } from "@/utils/fetchArtNews";
import fetch from "node-fetch";

// POST /api/ai-generate-post
// Body: { scheduleId?: string, prompt?: string, autoPublish?: boolean, boardId?: string }

export async function POST(req: NextRequest) {
  // verify service role key presence
  console.log("SERVICE_KEY?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { prompt, scheduleId, autoPublish = false, boardId } = await req.json();

    const repToken = process.env.REPLICATE_API_TOKEN;
    if (!repToken) {
      console.log("REPLICATE_API_TOKEN env 가 필요합니다.");
      return NextResponse.json({ error: "missing-replicate-token" }, { status: 500 });
    }

    // Supabase 클라이언트 – 이후 샘플 인기글 추출에 사용
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    // 커뮤니티 인기글 샘플 (few-shot) 삽입
    let samples = "";
    if (boardId) {
      const { getSamplePosts } = await import("@/utils/getSamplePosts");
      samples = await getSamplePosts(supabase, boardId, 5);
    }

    // 기본 프롬프트 템플릿 – 예시 포함, AI 티 금지 지침 포함
    const basePrompt = `다음 규칙에 따라 한국어로 글을 작성해라.\n\n${
      samples ? `다음은 인기 커뮤니티 글 예시이다. 문체·분위기를 참고하되 문장과 표현은 절대 복사하지 마라.\n${samples}\n\n` : ""
    }${prompt ? `${prompt}\n\n` : ""}규칙:\n1) 제목은 핵심을 50자 이내로 요약\n2) 본문은 400~600자, 자연스러운 커뮤니티 말투(존댓말/반말 혼용 가능)\n3) 마크다운 기호(**, # 등)와 이모티콘 사용 금지\n4) AI·챗봇·모델 등의 단어 금지\n5) 문단을 2~4개로 구분하고, 마지막 문장은 마침표로 끝냄\n6) 표절 금지, 반드시 창작문 작성\n\n제목:`;

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
          temperature: 1.0,
          top_p: 0.9,
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

    // 후처리 – 불필요한 마크다운 및 AI 티 제거
    const sanitize = (text: string) =>
      text
        .replace(/\*\*(.*?)\*\*/g, "$1") // **bold** 제거
        .replace(/^#+\s?/gm, "") // 헤딩 제거
        .replace(/AI[가-힣\s]+작성[^\n]*\n?/gi, "") // AI 언급 제거
        .replace(/```[\s\S]*?```/g, "") // 코드블록 제거
        .replace(/\n{3,}/g, "\n\n") // 연속 개행 정리
        .trim();

    const cleanText = sanitize(rawText);

    // 2) 간단 후처리 – 제목과 본문 분리 규칙: 첫 줄을 제목으로 간주
    const [firstLine, ...restLines] = cleanText.split("\n").filter(Boolean);
    const title = firstLine.replace(/^#*/g, "").trim();
    const content = restLines.join("\n").trim();

    // 3) Supabase insert (draft) - use admin client with service_role key (RLS 우회)
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

    // autoPublish 시 community_post에도 추가
    if (autoPublish) {
      const { error: commErr } = await supabase.from("community_post").insert({
        title,
        content,
        user_id: null, // 시스템 생성
        likes: 0,
        is_ai_generated: true,
        created_at: new Date().toISOString(),
      });
      if (commErr) {
        console.log("community insert error", commErr);
      }
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (e: any) {
    console.log("ai-generate-post error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
} 