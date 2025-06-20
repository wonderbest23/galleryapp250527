import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";

// Admin Supabase client (service role key required)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const AI_ACCOUNTS = ["gpt_user_1", "gpt_user_2", "gpt_user_3"];

export async function POST() {
  try {
    // 1) 가장 인기 전시회 제목 하나 가져오기 (없으면 기본값)
    const { data: exhibition } = await supabaseAdmin
      .from("exhibition")
      .select("name")
      .order("review_count", { ascending: false })
      .limit(1)
      .maybeSingle();

    const title = exhibition?.name || "빛으로 그린 도시, 2025 미디어 아트 展";

    // 2) OpenAI 프롬프트 구성
    const prompt = `너는 예술 애호가야. 아래 전시를 관람한 후 감상평을 300자 이내로 남겨줘.\n전시 제목: "${title}"\n스타일: 블로그형식, 감성적, 너무 형식적이지 않게`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // gpt-4o-mini etc. 수정 가능
      messages: [
        { role: "system", content: "너는 예술에 관심이 많은 블로거야." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "";
    if (!content) throw new Error("OpenAI returned empty content");

    // 3) 랜덤 AI 계정 선택
    const author_id = AI_ACCOUNTS[Math.floor(Math.random() * AI_ACCOUNTS.length)];

    // 4) DB insert (community_post)
    const { error: insertErr } = await supabaseAdmin.from("community_post").insert({
      user_id: author_id,
      nickname: author_id, // 표시용 별명
      category: "AI",      // 카테고리 태그
      title: title.slice(0, 60),
      content,
      likes: 0,
      views: 0,
    });

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("generate-post error", err);
    return NextResponse.json({ success: false, error: String(err?.message || err) }, { status: 500 });
  }
} 