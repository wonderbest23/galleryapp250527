export const runtime = "nodejs"; // 환경변수 접근을 위해 Node.js 런타임 고정

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchArtHeadlines } from "@/utils/fetchArtNews";
import fetch from "node-fetch";

// POST /api/ai-generate-post
// Body: { scheduleId?: string, prompt?: string, autoPublish?: boolean, boardId?: string, extra?: string }

export async function POST(req: NextRequest) {
  // verify service role key presence
  console.log("SERVICE_KEY?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { prompt, scheduleId, autoPublish = false, boardId, extra } = await req.json();

    // Supabase 클라이언트 – 이후 샘플 인기글 추출 및 schedule 조회에 사용
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    // 0) 스케줄 mode 확인
    let mode: "ai" | "scrape" | "mix" = "ai";
    let scheduleRow:any=null;
    if (scheduleId) {
      const { data: sch } = await supabase.from("ai_post_schedules").select("*").eq("id", scheduleId).maybeSingle();
      if (sch){ scheduleRow=sch; if(sch.mode) mode = sch.mode as any; }
    }

    // run_at_list 스케줄링: 가장 이른 시간이 아직 도래하지 않았으면 skip
    if(scheduleRow?.run_at_list?.length){
      const first=new Date(scheduleRow.run_at_list[0]);
      if(first>new Date()){
        return NextResponse.json({skip:true,reason:"not-due"});
      }
      // pop first
      await supabase.from("ai_post_schedules").update({run_at_list:scheduleRow.run_at_list.slice(1)}).eq("id",scheduleId);
    }

    // scrape-only 모드 (Replicate 토큰 불필요)
    if (mode === "scrape") {
      // extra JSON 파싱
      let extraObj: any = {};
      if (extra) {
        try { extraObj = typeof extra === 'string' ? JSON.parse(extra) : extra; } catch {}
      } else if (scheduleId) {
        // 스케줄 행의 prompt_template 에 JSON 이 있을 수 있음
        const { data: schRow } = await supabase.from('ai_post_schedules').select('prompt_template').eq('id', scheduleId).maybeSingle();
        try { extraObj = JSON.parse(schRow?.prompt_template || '{}'); } catch {}
      }

      const keyword = extraObj.keyword || "한국 미술 전시";
      const sources: string[] = extraObj.sources || ["brave"];

      // 스크레이퍼 실행
      if (sources.includes('brave')) {
        const { scrapeBrave } = await import("@/utils/scrapers/braveSearch");
        await scrapeBrave(keyword);
      }
      if (sources.includes('visitseoul')) {
        const { scrapeVisitSeoul } = await import("@/utils/scrapers/visitSeoul");
        await scrapeVisitSeoul(extraObj.visitSeoulMonth);
      }

      // 2) 오늘 하루치 발행 스케줄 생성
      const { generateScheduleForToday } = await import("@/utils/scheduleGenerator");
      await generateScheduleForToday();

      return NextResponse.json({ ok: true, mode: "scrape", sources });
    }

    // mix 모드: 50% 확률 스크랩 먼저 시도
    if (mode === "mix" && Math.random() < 0.5) {
      try {
        const { publishScraped } = await import("@/utils/publishScraped");
        const res = await publishScraped();
        if (!res.skip) {
          return NextResponse.json({ ok: true, mode: "scrape", res });
        }
      } catch (e) {
        console.log("publishScraped error, fallback to AI", e);
      }
    }

    // 1) 이후는 AI 생성 로직 -------------------------------------------------
    const repToken = process.env.REPLICATE_API_TOKEN;
    if (!repToken) {
      console.log("REPLICATE_API_TOKEN env 가 필요합니다.");
      return NextResponse.json({ error: "missing-replicate-token" }, { status: 500 });
    }

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

    // 2) Replicate API 호출
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
      } else {
        // 댓글 자동 생성 (실패 시 로깅만)
        try {
          const port = process.env.PORT || '3000';
          await fetch(`http://127.0.0.1:${port}/api/ai-generate-comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: data.id })
          });
        } catch (e) {
          console.log('auto comment error', e);
        }
      }
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (e: any) {
    console.log("ai-generate-post error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
} 