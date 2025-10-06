import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { request_id, reason } = await request.json();

    if (!request_id || !reason) {
      return NextResponse.json({ success: false, error: '요청 ID와 재검토 사유가 필요합니다.' }, { status: 400 });
    }

    // 재검토 요청 처리
    const { data, error } = await supabase.rpc('request_point_re_review', {
      p_request_id: request_id,
      p_user_id: user.id,
      p_reason: reason
    });

    if (error) {
      console.error('재검토 요청 오류:', error);
      return NextResponse.json({ success: false, error: '재검토 요청에 실패했습니다.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: '권한이 없거나 요청을 찾을 수 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '재검토 요청이 제출되었습니다.' 
    });

  } catch (error) {
    console.error('재검토 요청 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

