import { NextResponse } from 'next/server';

export async function POST(req) {
  // 현재는 실제 차단 백엔드가 없어 대시보드 동작만 보장
  const body = await req.json().catch(() => ({}));
  console.log('IP block mock:', body);
  return NextResponse.json({ success: true });
}


