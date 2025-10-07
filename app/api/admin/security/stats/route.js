import { NextResponse } from 'next/server';

export async function GET() {
  // 대시보드 시각화가 깨지지 않도록 더미 데이터 반환
  return NextResponse.json({
    success: true,
    data: {
      traffic: { requests24h: 0, requestsLastHour: 0, requestsLastMinute: 0, uniqueIps24h: 0, errorRequests: 0 },
      security: { suspiciousRequests: 0, blockedIps: 0, securityEvents: 0 },
      analytics: { hourlyTraffic: [], topIps: [] }
    }
  });
}


