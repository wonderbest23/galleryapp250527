import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { 
      exhibition_id, 
      visit_time,
      location_data,
      qr_code_data 
    } = await request.json();

    if (!exhibition_id || !visit_time) {
      return NextResponse.json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 전시회 정보 조회
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibition')
      .select('*')
      .eq('id', exhibition_id)
      .single();

    if (exhibitionError || !exhibition) {
      return NextResponse.json({ success: false, error: '전시회 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 중복 방문 인증 체크
    const { data: existingVerification } = await supabase
      .from('visit_verifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('exhibition_id', exhibition_id)
      .single();

    if (existingVerification) {
      return NextResponse.json({ success: false, error: '이미 방문 인증이 완료된 전시회입니다.' }, { status: 400 });
    }

    // 위치 및 시간 검증 로직 (실제 구현에서는 더 정교한 검증 필요)
    const isValidLocation = true; // 임시로 항상 true
    const isValidTime = true; // 임시로 항상 true
    const isQrValid = true; // 임시로 항상 true

    const verificationStatus = (isValidLocation && isValidTime && isQrValid) ? 'verified' : 'rejected';
    const rejectionReason = verificationStatus === 'rejected' ? '위치 또는 시간 검증 실패' : null;

    // 방문 인증 기록 생성
    const { data: verification, error: verificationError } = await supabase
      .from('visit_verifications')
      .insert([
        {
          user_id: user.id,
          exhibition_id: exhibition_id,
          visit_time: visit_time,
          location_verified: isValidLocation,
          qr_verified: isQrValid,
          verification_status: verificationStatus,
          rejection_reason: rejectionReason,
          verified_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
        }
      ])
      .select()
      .single();

    if (verificationError) {
      console.error('방문 인증 생성 오류:', verificationError);
      return NextResponse.json({ success: false, error: '방문 인증에 실패했습니다.' }, { status: 500 });
    }

    // 검증 성공 시 포인트 적립
    if (verificationStatus === 'verified') {
      const { data: pointResult, error: pointError } = await supabase
        .from('point_transactions')
        .insert([
          {
            user_id: user.id,
            transaction_type: 'earned',
            amount: 1000, // 방문 인증 포인트
            source: 'visit',
            source_id: exhibition_id,
            status: 'locked',
            lock_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ])
        .select()
        .single();

      if (pointError) {
        console.error('포인트 적립 오류:', pointError);
      } else {
        // 프로필 포인트 업데이트
        await supabase.rpc('increment_points', {
          user_id: user.id,
          points: 1000
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        verification_id: verification.id,
        status: verificationStatus,
        points_earned: verificationStatus === 'verified' ? 1000 : 0,
        message: verificationStatus === 'verified' 
          ? '방문 인증 완료! 1,000P가 적립되었습니다 (48시간 후 사용 가능)'
          : '방문 인증 실패: 위치 또는 시간을 다시 확인해주세요'
      }
    });

  } catch (error) {
    console.error('방문 인증 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
