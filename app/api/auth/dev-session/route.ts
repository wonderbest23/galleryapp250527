import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    // 개발환경에서만 허용
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        success: false, 
        error: '개발환경에서만 사용 가능합니다.' 
      }, { status: 403 });
    }

    // 개발용 세션 쿠키 확인
    const devSessionCookie = request.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('dev-session='));
    
    if (!devSessionCookie) {
      return NextResponse.json({ 
        success: false, 
        error: '개발용 세션이 없습니다.' 
      }, { status: 401 });
    }

    const sessionData = JSON.parse(decodeURIComponent(devSessionCookie.split('=')[1]));

    // Supabase에서 최신 프로필 정보 가져오기
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.user.id)
      .single();

    if (error) {
      console.error('프로필 조회 오류:', error);
      return NextResponse.json({ 
        success: false, 
        error: '프로필 조회에 실패했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        user: sessionData.user,
        profile: profile,
        points: profile.points || 0,
        grade: profile.grade || 'bronze',
        isArtist: profile.isArtist || false,
        isJournalist: profile.is_journalist_approved || false
      }
    });

  } catch (error) {
    console.error('개발용 세션 확인 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '개발용 세션 확인에 실패했습니다.' 
    }, { status: 500 });
  }
}
