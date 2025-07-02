export const runtime = "nodejs"; // Edge 환경에서 env 미노출 문제 방지

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
  try {
    const { postId, boardId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: 'missing-postId' }, { status: 400 });
    }

    const repToken = process.env.REPLICATE_API_TOKEN;
    if (!repToken) {
      console.log('REPLICATE_API_TOKEN missing');
      return NextResponse.json({ error: 'missing-replicate-token' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // fetch post data
    const { data: post, error: postErr } = await supabase
      .from('community_post')
      .select('title, content')
      .eq('id', postId)
      .single();
    if (postErr || !post) {
      console.log('post fetch error', postErr);
      return NextResponse.json({ error: 'post-not-found' }, { status: 404 });
    }

    // fetch sample comments
    let sampleComments = '';
    if (boardId) {
      const { getSampleComments } = await import('@/utils/getSampleComments');
      sampleComments = await getSampleComments(supabase, boardId, 5);
    }

    const basePrompt = `다음 게시글에 달린 댓글 예시를 참고하여, 30~60자 분량의 짧은 댓글을 작성해라.\n\n[게시글]\n제목: ${post.title}\n본문: ${post.content.replace(/\n+/g, ' ')}\n\n${sampleComments ? `[댓글예시]\n${sampleComments}\n\n` : ''}규칙:\n1) 자연스러운 한국어\n2) 마크다운, 별표, AI 언급 금지\n3) 구어체 사용 가능\n\n댓글:`;

    // call replicate API (latest version similar to ai-generate-post logic)
    let repVersion = process.env.REPLICATE_MODEL_VERSION;
    if (!repVersion || repVersion.length < 40) {
      try {
        const latestRes = await fetch('https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct', {
          headers: { Authorization: `Token ${repToken}` },
        });
        const latestJson: any = await latestRes.json();
        repVersion = latestJson?.latest_version?.id;
        console.log('latest version fetched', repVersion);
      } catch (e) {
        console.log('fetch version error', e);
      }
    }
    if (!repVersion) {
      return NextResponse.json({ error: 'missing-replicate-version' }, { status: 500 });
    }

    const repRes = await fetch(`https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct/versions/${repVersion}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${repToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { prompt: basePrompt, max_tokens: 100 },
      }),
    });

    if (!repRes.ok) {
      console.log('replicate error', await repRes.text());
      return NextResponse.json({ error: 'replicate-error' }, { status: 500 });
    }

    let repJson: any = await repRes.json();
    let waitCount = 0;
    while (repJson?.status && repJson.status !== 'succeeded' && repJson.status !== 'failed' && waitCount < 10) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${repJson.id}`, {
        headers: { Authorization: `Token ${repToken}`, 'Content-Type': 'application/json' },
      });
      repJson = await pollRes.json();
      waitCount += 1;
    }

    if (repJson.status !== 'succeeded') {
      console.log('replicate processing not succeeded', repJson);
      return NextResponse.json({ error: 'replicate-processing' }, { status: 500 });
    }

    const rawText = repJson?.output?.join ? repJson.output.join('') : repJson.output || '';

    // sanitize
    const clean = rawText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^#+\s?/gm, '')
      .replace(/AI[가-힣\s]+작성[^\n]*\n?/gi, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!clean) {
      return NextResponse.json({ error: 'empty-output' }, { status: 500 });
    }

    // insert comment
    const { error: insErr } = await supabase.from('community_comment').insert({
      post_id: postId,
      user_id: null,
      content: clean,
      created_at: new Date().toISOString(),
      likes: 0,
    });
    if (insErr) {
      console.log('insert comment error', insErr);
      return NextResponse.json({ error: 'db-error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, comment: clean });
  } catch (e) {
    console.log('ai-generate-comment error', e);
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
} 