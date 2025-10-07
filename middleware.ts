import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createServerClient } from '@supabase/ssr';

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

// 트래픽 로깅 및 보안 검사 함수
async function logTrafficAndSecurityCheck(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const { pathname } = request.nextUrl;
    const method = request.method;
    const startTime = Date.now();

    // 정적 파일은 로그 제외
    if (pathname.includes('_next/') || pathname.includes('.')) return;

    // Supabase 클라이언트 생성 (환경변수 안전 확인)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      console.log('Supabase 환경변수 없음, 트래픽 로깅 건너뜀');
      return;
    }

    const supabase = createServerClient(
      supabaseUrl,
      serviceKey,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {}
        }
      }
    );

    // 차단된 IP 확인
    const { data: blocked } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ip)
      .single();

    if (blocked) {
      console.log('Blocked IP detected:', ip);
      return new NextResponse('IP Blocked', { status: 403 });
    }

    // 의심스러운 패턴 감지
    const suspiciousPatterns = [
      /\b(union|select|insert|delete|drop|create|alter)\b/i,
      /<script/i,
      /\.\.\//,
      /\/etc\/passwd/,
      /\beval\(/,
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(pathname) || pattern.test(userAgent)
    );

    // 1분간 요청 수 확인 (DDoS 방지)
    const { count: recentRequests } = await supabase
      .from('traffic_logs')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString());

    if ((recentRequests || 0) > 100) {
      // 1분에 100회 초과 요청 시 자동 차단
      await supabase.from('blocked_ips').insert({
        ip_address: ip,
        reason: '1분간 100회 초과 요청 (DDoS 패턴)',
        auto_blocked: true,
        blocked_until: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1시간 차단
      });

      await supabase.from('security_events').insert({
        event_type: 'rate_limit',
        ip_address: ip,
        severity: 'high',
        details: { requests_per_minute: recentRequests, threshold: 100 },
        action_taken: 'auto_blocked_1hour'
      });

      console.log('Auto-blocked IP for rate limiting:', ip);
      return new NextResponse('Rate Limited', { status: 429 });
    }

    // 비동기로 트래픽 로그 (응답 지연 없음)
    supabase.from('traffic_logs').insert({
      ip_address: ip,
      user_agent: userAgent,
      path: pathname,
      method: method,
      response_time: Date.now() - startTime,
      is_suspicious: isSuspicious,
      status_code: 200 // 기본값, 실제 응답 후 업데이트 필요
    }).then(result => {
      if (result.error) console.log('Traffic log error:', result.error);
    });

    if (isSuspicious) {
      supabase.from('security_events').insert({
        event_type: 'suspicious_pattern',
        ip_address: ip,
        severity: 'medium',
        details: { path: pathname, user_agent: userAgent },
        action_taken: 'logged'
      }).then(result => {
        if (result.error) console.log('Security event log error:', result.error);
      });
    }

  } catch (e) {
    console.log('Traffic monitoring error:', e);
  }
}

export async function middleware(request: NextRequest) {
  // 트래픽 로깅 및 보안 검사 (비동기, 응답 지연 없음)
  logTrafficAndSecurityCheck(request);
  
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
      
      // admin 페이지의 경우 role이 admin 또는 master인지 확인
      if (pathname.startsWith('/admin')) {
        if (error || !profile || (profile.role !== 'admin' && profile.role !== 'master')) {
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
      
      // Kakao 2FA 임시 해제: kakao_verified 쿠키 체크 비활성화
      // if (pathname.startsWith('/admin') && pathname !== '/admin/kakao-auth') {
      //   const kakaoVerified = request.cookies.get('kakao_verified')?.value;
      //   if (kakaoVerified !== '1') {
      //     const url = new URL('/admin/kakao-auth', request.url);
      //     return NextResponse.redirect(url);
      //   }
      // }
      
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
