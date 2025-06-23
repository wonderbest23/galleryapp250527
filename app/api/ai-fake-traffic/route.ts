import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/ai-fake-traffic
// Body(optional): { batchSize?: number }

export async function POST(req: Request) {
  const { batchSize = 100 } = await req.json().catch(() => ({ batchSize: 100 }));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const { data: posts, error } = await supabase
      .from('community_post')
      .select('id, views, likes')
      .order('created_at', { ascending: false })
      .limit(batchSize);

    if (error) {
      console.log('fetch posts error', error);
      return NextResponse.json({ error: 'fetch-error' }, { status: 500 });
    }

    for (const p of posts || []) {
      if (Math.random() < 0.3) {
        const viewsInc = 1 + Math.floor(Math.random() * 15);
        const likesInc = Math.random() < 0.5 ? 0 : 1 + Math.floor(Math.random() * 3);
        await supabase
          .from('community_post')
          .update({
            views: (p.views || 0) + viewsInc,
            likes: (p.likes || 0) + likesInc,
          })
          .eq('id', p.id);
      }
    }

    console.log('ai-fake-traffic done');
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.log('ai-fake-traffic error', e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
} 