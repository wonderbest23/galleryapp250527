import { createClient } from "@supabase/supabase-js";
import { TOPICS, COMMENTS, NAMES, WORKS, HANDLES } from "./simTemplates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

type TopicCategory = keyof typeof TOPICS;

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillPlaceholders(tpl: string): string {
  return tpl
    .replace(/\{artist\}/g, rand(NAMES))
    .replace(/\{work\}/g, rand(WORKS))
    .replace(/\{title\}/g, rand(WORKS))
    .replace(/\{series\}/g, rand(WORKS))
    .replace(/\{handle\}/g, rand(HANDLES));
}

export async function simulatePost(boardId: number = 1) {
  const category = rand(Object.keys(TOPICS) as TopicCategory[]);
  const template = rand(TOPICS[category]);
  const text = fillPlaceholders(template);

  const [titleRaw, ...bodyArr] = text.split(/\.\s+/);
  const title = titleRaw.slice(0, 50);
  const content = bodyArr.join(". ").slice(0, 600);

  const { data, error } = await supabase
    .from("community_post")
    .insert({
      board_id: boardId,
      title,
      content,
      likes: 0,
      user_id: null,
      is_ai_generated: true,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.log("simulatePost insert error", error);
    return null;
  }
  return data?.id as number;
}

export async function simulateComment(boardId: number = 1, postId: number) {
  const style = rand(Object.keys(COMMENTS) as (keyof typeof COMMENTS)[]);
  const content = rand(COMMENTS[style]);

  const { error } = await supabase.from("community_comment").insert({
    board_id: boardId,
    post_id: postId,
    user_id: null,
    content,
    likes: 0,
    created_at: new Date().toISOString(),
  });
  if (error) {
    console.log("simulateComment insert error", error);
  }
}

async function commentOnFreshPosts({ boardId, minutes = 10, maxComments = 3 }: { boardId: number; minutes?: number; maxComments?: number }) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { data: posts, error } = await supabase
    .from("community_post")
    .select("id, created_at")
    .eq("board_id", boardId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) {
    console.log("fetch posts error", error);
    return;
  }
  if (!posts?.length) return;

  // fetch comment counts
  for (const p of posts) {
    const { count, error: cntErr } = await supabase
      .from("community_comment")
      .select("id", { count: "exact", head: true })
      .eq("post_id", p.id);
    if (cntErr) continue;
    if ((count ?? 0) >= maxComments) continue;

    const remaining = maxComments - (count ?? 0);
    const numToAdd = Math.ceil(Math.random() * remaining);
    for (let i = 0; i < numToAdd; i++) {
      await simulateComment(boardId, p.id);
    }
  }
}

export async function runSimulation({
  boardId = 1,
  postCount = 1,
  commentsPerPost = [1, 3],
  autoReply = true,
}: {
  boardId?: number;
  postCount?: number;
  commentsPerPost?: [number, number];
  autoReply?: boolean;
}) {
  // (A) 새 글 + 댓글
  for (let i = 0; i < postCount; i++) {
    const postId = await simulatePost(boardId);
    if (!postId) continue;
    const [minC, maxC] = commentsPerPost;
    const commentTotal = Math.floor(Math.random() * (maxC - minC + 1)) + minC;
    for (let c = 0; c < commentTotal; c++) {
      await simulateComment(boardId, postId);
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
    }
  }

  // (B) 최근 유저 글에 자동 댓글
  if (autoReply) {
    await commentOnFreshPosts({ boardId });
  }
}

// CLI 실행용: `node -r esbuild-register utils/simulateActivity.ts`
if (require.main === module) {
  runSimulation({ postCount: 1 }).then(() => {
    console.log("simulation done");
  });
} 