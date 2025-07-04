import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// 조회수 시뮬레이션 주기 실행 (최대 1회/5분)
let lastViewSim = 0;
let lastLikeSim = 0;

async function maybeSimulateViews(){
  const now = Date.now();
  if(now - lastViewSim < 60*1000) return;
  lastViewSim = now;
  try {
    const { simulateViews } = await import("@/utils/simulateViews");
    await simulateViews();
  } catch(e){ console.log('simulateViews error', e); }
}

async function maybeSimulateLikes(){
  const now = Date.now();
  if(now - lastLikeSim < 60*1000) return;
  lastLikeSim = now;
  try{
    const { simulateLikes } = await import("@/utils/simulateLikes");
    await simulateLikes();
  }catch(e){console.log('simulateLikes error',e);}  
}

export async function middleware(request: NextRequest) {
  // 주기적으로 조회수 시뮬레이터 실행 (비동기, 응답 지연 없음)
  maybeSimulateViews();
  maybeSimulateLikes();
  const { pathname } = request.nextUrl;
  
  // admin 또는 gallery 페이지 접근 확인
  if ((pathname.startsWith('/admin') && pathname !== '/admin/login') || 
      (pathname.startsWith('/gallery') && pathname !== '/gallery/login')) {
    try {
      // Supabase 클라이언트 생성
      const response = await updateSession(request);
      
      // Supabase에서 사용자 정보 가져오기
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const authHeader = request.headers.get('authorization');
      const cookies = request.cookies.getAll();
      
      // Supabase의 createServerClient를 호출하기 위한 수동 설정
      const { createServerClient } = await import('@supabase/ssr');
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return cookies;
          },
          setAll() {
            // 여기서는 쿠키를 설정할 필요 없음
          },
        },
      });
      
      // 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      // 사용자가 로그인되어 있지 않으면 해당하는 로그인 페이지로 리다이렉트
      if (!user) {
        const redirectUrl = pathname.startsWith('/admin') ? '/admin/login' : '/gallery/login';
        const url = new URL(redirectUrl, request.url);
        return NextResponse.redirect(url);
      }
      
      // 사용자 프로필 정보 가져오기
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      // admin 페이지의 경우 role이 master인지 확인
      if (pathname.startsWith('/admin')) {
        if (error || !profile || profile.role !== 'master') {
          const url = new URL('/admin/login', request.url);
          return NextResponse.redirect(url);
        }
      }
      
      // gallery 페이지의 경우 role이 gallery인지 확인
      if (pathname.startsWith('/gallery')) {
        if (error || !profile || profile.role !== 'gallery') {
          const url = new URL('/gallery/login', request.url);
          return NextResponse.redirect(url);
        }
      }
      
      // Kakao 2FA 확인: admin 영역에서 kakao_verified 쿠키 없으면 인증 페이지로 리다이렉트
      if (pathname.startsWith('/admin') && pathname !== '/admin/kakao-auth') {
        const kakaoVerified = request.cookies.get('kakao_verified')?.value;
        if (kakaoVerified !== '1') {
          const url = new URL('/admin/kakao-auth', request.url);
          return NextResponse.redirect(url);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Access check error:', error);
      const redirectUrl = pathname.startsWith('/admin') ? '/admin/login' : '/gallery/login';
      const url = new URL(redirectUrl, request.url);
      return NextResponse.redirect(url);
    }
  }
  
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
