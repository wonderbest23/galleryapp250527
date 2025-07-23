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
    if (process.env.KAKAO_CLIENT_SECRET) {
      params.append('client_secret', process.env.KAKAO_CLIENT_SECRET);
    }

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Kakao token exchange failed', errText);
      return NextResponse.redirect(new URL(`/admin/login?error=카카오 토큰 요청 실패: ${encodeURIComponent(errText)}`, request.url));
    }

    // 토큰 데이터 파싱
    const tokenData: { access_token: string } = await tokenRes.json();

    // 카카오 사용자 정보 조회
    let kakaoEmail: string | undefined;
    let kakaoPhone: string | undefined;
    try {
      const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      if (userRes.ok) {
        const userJson = await userRes.json();
        kakaoEmail = userJson?.kakao_account?.email;
        kakaoPhone = userJson?.kakao_account?.phone_number;
      }
    } catch (e) {
      console.error('kakao user fetch error', e);
    }

    // 허용 이메일 목록 확인 (콤마 구분)
    const allowedList = (process.env.KAKAO_ALLOWED_EMAILS || '').split(',').map(v => v.trim()).filter(Boolean);
    if (allowedList.length && (!kakaoEmail || !allowedList.includes(kakaoEmail))) {
      console.warn('Unauthorized kakao email', kakaoEmail);
      return NextResponse.redirect(new URL('/admin/login?error=허용되지_않은_카카오_계정', request.url));
    }

    // 세션 상태 업데이트 (Realtime 전달)
    if (state) {
      try {
        const supabase = await (await import('@/utils/supabase/server')).createClient();
        await supabase.from('kakao_sessions').update({ verified: true }).eq('id', state);
        // 이메일이 있고, phone_number가 있으면 profiles 테이블에 저장
        if (kakaoEmail && kakaoPhone) {
          // 이메일로 기존 유저 찾기
          const { data: userProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', kakaoEmail)
            .maybeSingle();
          if (userProfile && userProfile.id) {
            // 이미 가입된 경우 update
            await supabase.from('profiles').update({ phone: kakaoPhone }).eq('id', userProfile.id);
          }
          // (신규 가입은 별도 회원가입 로직에서 처리)
        }
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