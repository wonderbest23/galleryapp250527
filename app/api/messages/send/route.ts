import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { receiver_id, product_id, message } = await request.json();

    if (!receiver_id || !product_id || !message) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 메시지 저장
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        product_id,
        message,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.log('메시지 저장 오류:', error);
      return NextResponse.json({ error: '메시지 전송에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '메시지가 전송되었습니다.',
      data 
    });

  } catch (error) {
    console.log('메시지 전송 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
