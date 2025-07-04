import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    const supabase = await createClient();
    await supabase.from('kakao_sessions').insert({ id, verified: false });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('create kakao session error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
} 