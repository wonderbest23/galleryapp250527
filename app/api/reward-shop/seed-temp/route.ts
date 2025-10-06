import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 간단 보호: 로그인 또는 시크릿키 허용
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const allowKey = process.env.SEED_KEY || 'localdev';
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp?.user && key !== allowKey) {
      return NextResponse.json({ ok: false, error: '권한이 없습니다.' }, { status: 401 });
    }

    // 임시 전시 2건 - 필요 시 이미지/포인트만 교체해서 사용
    const items = [
      {
        title: '국립현대미술관 상설전 관람권',
        description: '마이페이지 리워드샵 테스트용 관람권입니다. 관리자 확인 후 발송됩니다.',
        points_required: 3000,
        image_url: '/exhibition/moma_card.png',
        is_active: true,
        stock: 50,
        category: 'ticket',
      },
      {
        title: '서울시립미술관 특별전 관람권',
        description: '포인트 결제 테스트용. 실제 티켓은 관리자 검수 후 전송됩니다.',
        points_required: 5000,
        image_url: '/exhibition/sema_card.png',
        is_active: true,
        stock: 50,
        category: 'ticket',
      },
    ];

    // 기존 임시 아이템 정리(중복 방지)
    await supabase.from('reward_shop_items').delete().or('title.eq.국립현대미술관 상설전 관람권,title.eq.서울시립미술관 특별전 관람권');

    const { error } = await supabase.from('reward_shop_items').insert(items);
    if (error) {
      console.log('리워드샵 임시 아이템 삽입 오류', error);
      return NextResponse.json({ ok: false, error: '삽입 실패' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inserted: items.length });
  } catch (e: any) {
    console.log('seed-temp 오류', e?.message || e);
    return NextResponse.json({ ok: false, error: '서버 오류' }, { status: 500 });
  }
}
