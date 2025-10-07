import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // 개발환경에서만 허용
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        success: false, 
        error: '개발환경에서만 사용 가능합니다.' 
      }, { status: 403 });
    }

    // 세션 삭제
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('개발용 로그아웃 오류:', error);
      return NextResponse.json({ 
        success: false, 
        error: '개발용 로그아웃에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '개발용 로그아웃 성공'
    });

  } catch (error) {
    console.error('개발용 로그아웃 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '개발용 로그아웃에 실패했습니다.' 
    }, { status: 500 });
  }
}
