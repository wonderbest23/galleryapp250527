import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 시간 기준 설정
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    // 1. 24시간 요청 수
    const { count: requests24h } = await supabase
      .from('traffic_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString());
    
    // 2. 1시간 요청 수
    const { count: requestsLastHour } = await supabase
      .from('traffic_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString());
    
    // 3. 1분 요청 수
    const { count: requestsLastMinute } = await supabase
      .from('traffic_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneMinuteAgo.toISOString());
    
    // 4. 고유 IP 수 (24시간)
    const { data: uniqueIpsData } = await supabase
      .from('traffic_logs')
      .select('ip_address')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .not('ip_address', 'is', null);
    
    const uniqueIps = new Set(uniqueIpsData?.map(log => log.ip_address) || []);
    const uniqueIps24h = uniqueIps.size;
    
    // 5. 의심스러운 요청 수
    const { count: suspiciousRequests } = await supabase
      .from('traffic_logs')
      .select('id', { count: 'exact', head: true })
      .eq('is_suspicious', true)
      .gte('created_at', twentyFourHoursAgo.toISOString());
    
    // 6. 차단된 IP 수 (실제 blocked_ips 테이블에서 조회)
    const { count: blockedIps } = await supabase
      .from('blocked_ips')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // 7. 보안 이벤트 수 (의심스러운 요청 = 보안 이벤트로 간주)
    const securityEvents = suspiciousRequests || 0;
    
    // 8. 에러 요청 수 (error_logs 테이블에서 조회)
    const { count: errorRequests } = await supabase
      .from('error_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString());
    
    // 9. 시간대별 트래픽 (최근 24시간, 1시간 단위)
    const hourlyTraffic = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      const { count } = await supabase
        .from('traffic_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', hourStart.toISOString())
        .lt('created_at', hourEnd.toISOString());
      
      hourlyTraffic.push({
        hour: hourStart.getHours(),
        requests: count || 0
      });
    }
    
    // 10. 상위 IP 목록 (24시간)
    const { data: trafficData } = await supabase
      .from('traffic_logs')
      .select('ip_address')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .not('ip_address', 'is', null);
    
    // IP별 요청 수 집계
    const ipCounts = {};
    (trafficData || []).forEach(log => {
      if (log.ip_address) {
        ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1;
      }
    });
    
    // 상위 10개 IP
    const topIps = Object.entries(ipCounts)
      .map(([ip, requests]) => ({ ip, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
    
    return NextResponse.json({
      success: true,
      data: {
        traffic: {
          requests24h: requests24h || 0,
          requestsLastHour: requestsLastHour || 0,
          requestsLastMinute: requestsLastMinute || 0,
          uniqueIps24h: uniqueIps24h,
          errorRequests: errorRequests || 0
        },
        security: {
          suspiciousRequests: suspiciousRequests || 0,
          blockedIps: blockedIps || 0,
          securityEvents: securityEvents
        },
        analytics: {
          hourlyTraffic: hourlyTraffic,
          topIps: topIps
        }
      }
    });
    
  } catch (error) {
    console.error('보안 통계 조회 오류:', error);
    // 오류 발생 시에도 대시보드가 깨지지 않도록 더미 데이터 반환
    return NextResponse.json({
      success: true,
      data: {
        traffic: { requests24h: 0, requestsLastHour: 0, requestsLastMinute: 0, uniqueIps24h: 0, errorRequests: 0 },
        security: { suspiciousRequests: 0, blockedIps: 0, securityEvents: 0 },
        analytics: { hourlyTraffic: [], topIps: [] }
      }
    });
  }
}


