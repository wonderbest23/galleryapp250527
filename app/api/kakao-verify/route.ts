import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/admin/login?error=카카오 인증 코드가 없습니다', request.url));
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.NEXT_PUBLIC_KAKAO_REST_KEY as string);
    params.append('redirect_uri', process.env.NEXT_PUBLIC_KAKAO_REDIRECT as string);
    params.append('code', code);

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      console.error('Kakao token exchange failed', await tokenRes.text());
      return NextResponse.redirect(new URL('/admin/login?error=카카오 토큰 요청 실패', request.url));
    }

    // 토큰 데이터 파싱 (필요 시 사용)
    await tokenRes.json();

    // 세션 상태 업데이트 (Realtime 전달)
    if (state) {
      try {
        const supabase = await (await import('@/utils/supabase/server')).createClient();
        await supabase.from('kakao_sessions').update({ verified: true }).eq('id', state);
      } catch(e){
        console.error('supabase update error', e);
      }
    }

    const response = NextResponse.redirect(new URL('/admin/gallery', request.url));
    // kakao_verified 쿠키 설정: 1시간 유효
    response.cookies.set('kakao_verified', '1', {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60,
    });
    return response;
  } catch (e) {
    console.error('Kakao verify error', e);
    return NextResponse.redirect(new URL('/admin/login?error=카카오 인증 오류', request.url));
  }
} 