import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { review_id, points = 500 } = await request.json();

    if (!review_id) {
      return NextResponse.json({ success: false, error: '리뷰 ID가 필요합니다.' }, { status: 400 });
    }

    // 포인트 직접 적립 (검토 없이)
    const { data, error } = await supabase
      .from('point_transactions')
      .insert([{
        user_id: user.id,
        source: 'review',
        source_id: review_id,
        amount: points,
        type: 'earn',
        status: 'completed',
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('포인트 적립 오류:', error);
      return NextResponse.json({ success: false, error: '포인트 적립에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: { request_id: data },
      message: '포인트 검토 요청이 생성되었습니다.' 
    });

  } catch (error) {
    console.error('포인트 검토 요청 생성 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

