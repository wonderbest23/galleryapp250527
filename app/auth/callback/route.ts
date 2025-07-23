import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to");
  
  console.log("Auth 콜백 호출됨, 리다이렉트 경로:", redirectTo);
  console.log("전체 URL:", request.url);
  
  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    console.log("인증 코드 교환 완료");
    
    if (sessionError) {
      console.log("세션 교환 중 오류:", sessionError);
      return NextResponse.redirect(`${origin}/mypage`);
    }

    // 세션이 성공적으로 생성된 경우 사용자 role 확인
    if (sessionData?.session?.user) {
      const user = sessionData.session.user;
      let phone = user.user_metadata?.phone_number;
      // access_token으로 카카오 API를 직접 호출해 phone_number를 받아옴 (user_metadata에 없을 때)
      if (!phone && sessionData.session.provider_token) {
        try {
          const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
              Authorization: `Bearer ${sessionData.session.provider_token}`,
            },
          });
          if (kakaoRes.ok) {
            const kakaoJson = await kakaoRes.json();
            phone = kakaoJson?.kakao_account?.phone_number;
          }
        } catch (e) {
          console.log('카카오 API 호출 중 오류:', e);
        }
      }
      if (phone) {
        await supabase.from('profiles').update({ phone }).eq('id', user.id);
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log("프로필 조회 중 오류:", profileError);
        return NextResponse.redirect(`${origin}/mypage`);
      }

      // role이 'client'가 아닌 경우 로그인 페이지로 리다이렉트
      if (!profile || profile.role !== 'client') {
        console.log("클라이언트 권한이 아님, 로그인 페이지로 리다이렉트");
        // 세션 삭제
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/mypage`);
      }

      console.log("클라이언트 권한 확인됨");
    }
  }
  
  // 리다이렉트 경로가 있는 경우 해당 경로로 이동
  if (redirectTo) {
    const fullRedirectUrl = `${origin}${redirectTo}`;
    console.log("리다이렉트 처리: ", fullRedirectUrl);
    return NextResponse.redirect(fullRedirectUrl);
  }

  // 기본 리다이렉트 경로
  console.log("기본 경로로 리다이렉트");
  return NextResponse.redirect(`${origin}/mypage/success`);
}
