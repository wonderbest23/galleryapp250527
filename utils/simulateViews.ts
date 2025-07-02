import { createClient } from "@supabase/supabase-js";

const WINDOW_HOURS = 24; // only simulate within first 24h

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 계산용: 좋아요 수(likes)에 따라 허용되는 최대 조회수 산정
function targetViews(currentLikes:number):number{
  if(currentLikes>=10) return 5000; // 베스트 글 – 최고 5천
  if(currentLikes>=5) return 1500;  // 중간 인기
  return 500;                       // 일반 글
}

/**
 * Increment views of recent community posts so that they organically rise up to max 5000 within 24h.
 * – Each call will add 10~300 views per post, but never exceed target.
 */
export async function simulateViews() {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabaseAdmin
    .from("community_post")
    .select("id, views, likes")
    .gte("created_at", since);

  if (error) throw error;
  if (!posts?.length) return { skipped: true };

  for (const p of posts) {
    const maxForPost = targetViews(p.likes ?? 0);
    if ((p.views ?? 0) >= maxForPost) continue;

    const remaining = maxForPost - (p.views ?? 0);
    // 증가 폭: 남은 양의 3~8% 범위, 최소 5 최대 200
    const minInc = Math.max(5, Math.floor(remaining * 0.03));
    const maxInc = Math.max(10, Math.floor(remaining * 0.08));
    const inc = rand(minInc, Math.min(maxInc, 200));

    try {
      // fast update – no viewer table, just numeric add (two overloads may exist)
      await supabaseAdmin.rpc("increment_view", { p_post_id: p.id });
    } catch {
      // fallback direct update
      await supabaseAdmin
        .from("community_post")
        .update({ views: (p.views ?? 0) + inc })
        .eq("id", p.id);
    }
  }

  return { updated: posts.length };
} 