import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // 개발환경에서만 허용
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        success: false, 
        error: '개발환경에서만 사용 가능합니다.' 
      }, { status: 403 });
    }

    const { email = 'dev@test.com', name = '개발자' } = await request.json();

    // 개발용 사용자 데이터
    const devUser = {
      id: 'dev-user-123',
      email: email,
      user_metadata: {
        name: name,
        full_name: name
      }
    };

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 개발용 프로필 생성/업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: devUser.id,
        email: devUser.email,
        full_name: devUser.user_metadata.full_name,
        name: devUser.user_metadata.name,
        avatar_url: null,
        points: 5000, // 개발용 포인트
        grade: 'gold', // 골드 등급
        isArtist: true, // 작가 승인
        isArtistApproval: true, // 작가 승인 완료
        is_journalist_approved: true, // 기자단 승인 완료
        artist_name: '개발자 작가',
        artist_phone: '010-1234-5678',
        artist_intro: '개발용 테스트 작가입니다.',
        artist_birth: '1990-01-01',
        artist_genre: '현대미술',
        artist_proof: '개발용 작가 증명서',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('개발용 프로필 생성 오류:', profileError);
    }

    // 개발용 세션 생성 (쿠키 설정)
    const response = NextResponse.json({ 
      success: true, 
      data: {
        user: devUser,
        message: '개발용 로그인 성공 (작가 & 기자단 승인 완료)',
        points: 5000,
        grade: 'gold',
        isArtist: true,
        isJournalist: true
      }
    });

    // 개발용 세션 쿠키 설정
    response.cookies.set('dev-session', JSON.stringify({
      user: devUser,
      points: 5000,
      grade: 'gold',
      isArtist: true,
      isJournalist: true
    }), {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24시간
    });

    return response;

  } catch (error) {
    console.error('개발용 로그인 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '개발용 로그인에 실패했습니다.' 
    }, { status: 500 });
  }
}
