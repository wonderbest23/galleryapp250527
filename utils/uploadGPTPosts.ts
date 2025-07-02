import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

export interface GPTPost { title: string; content: string }

/** GPT 응답 텍스트를 30개 뉴스 객체로 파싱 */
export function parseGPTTextToPosts(text: string): GPTPost[] {
  // CRLF→LF 정규화 후 빈 줄 기준 분리
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const posts: GPTPost[] = [];
  let current: GPTPost = { title: "", content: "" };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue; // skip blank

    // "1. 제목" 또는 숫자 없이도 줄 바꿈만으로 제목이 올 수 있어 두 패턴 모두 처리
    const titleMatch = line.match(/^\s*(?:\d{1,2}[\).]?)?\s*(.+)$/);
    if (titleMatch && current.title === "") {
      // 새 제목 시작
      current.title = titleMatch[1].trim();
      continue;
    }

    // 본문 누적 – 제목이 이미 셋팅된 상태에서 빈 줄 나오면 본문 끝
    if (current.title) {
      current.content += line + " ";
      // 본문 끝은 마침표로 끝난 문장이므로 길이가 충분할 때 다음 제목을 기다림
      if (current.content.length > 100 && line.endsWith(".")) {
        posts.push({ ...current, content: current.content.trim() });
        current = { title: "", content: "" };
      }
    }
  }
  // 마지막 포스트 푸시
  if (current.title) posts.push({ ...current, content: current.content.trim() });

  return posts.slice(0, 30);
}

/** 파싱 후 community_post 테이블에 업로드 */
export async function uploadGPTPosts(gptText: string) {
  const postList = parseGPTTextToPosts(gptText);
  if (postList.length === 0) {
    console.log("파싱 결과가 없습니다");
    return;
  }

  const formatted = postList.map((p) => ({
    title: p.title,
    content: p.content,
    user_id: "ai-bot-system",
    category: "뉴스",
    is_ai_generated: true,
  }));

  const { error } = await supabase.from("community_post").insert(formatted);
  if (error) {
    console.error("업로드 실패:", error);
  } else {
    console.log(`업로드 완료: ${formatted.length}개 포스트`);
  }
} 