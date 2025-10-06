import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // profiles 테이블에서 직접 포인트 조회
    const { data: profileData } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();

    const totalPoints = profileData?.points || 0;
    
    // 기존 리뷰 기반으로 포인트 계산 (리뷰당 500P)
    const { data: reviewData } = await supabase
      .from('exhibition_review')
      .select('id')
      .eq('user_id', user.id);

    const reviewCount = reviewData?.length || 0;
    const expectedPoints = reviewCount * 500;
    
    // 실제 포인트와 예상 포인트 중 더 큰 값 사용
    const finalTotalPoints = Math.max(totalPoints, expectedPoints);
    
    // 검토 필요 포인트는 최근 48시간 내 작성된 리뷰 기준으로 계산
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: recentReviewData } = await supabase
      .from('exhibition_review')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', fortyEightHoursAgo);

    const recentReviewCount = recentReviewData?.length || 0;
    const lockedPoints = recentReviewCount * 500;
    const availablePoints = Math.max(0, finalTotalPoints - lockedPoints);

    // 사용자 등급 정보 조회
    const { data: gradeInfo } = await supabase
      .from('user_grades')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 잠금 해제 예정 시간 계산 (최근 리뷰 작성 시간 + 48시간)
    let nextUnlock = null;
    if (recentReviewCount > 0) {
      const { data: latestReview } = await supabase
        .from('exhibition_review')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (latestReview) {
        const reviewTime = new Date(latestReview.created_at);
        const unlockTime = new Date(reviewTime.getTime() + 48 * 60 * 60 * 1000);
        nextUnlock = unlockTime.toISOString();
      }
    }

    // 최근 리뷰 내역을 포인트 거래 내역으로 사용
    const { data: recentTransactions } = await supabase
      .from('exhibition_review')
      .select('id, created_at, rating')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // 등급별 교환 포인트 계산
    const getExchangePoints = (grade: string) => {
      switch (grade) {
        case 'bronze': return 1500;
        case 'silver': return 1400;
        case 'gold': return 1300;
        case 'platinum': return 1200;
        default: return 1500;
      }
    };

    const currentGrade = gradeInfo?.grade || 'bronze';
    const exchangePoints = getExchangePoints(currentGrade);

    return NextResponse.json({ 
      success: true, 
      data: {
        total_points: finalTotalPoints,
        available_points: availablePoints,
        locked_points: lockedPoints,
        grade: currentGrade,
        exchange_points: exchangePoints,
        next_unlock: nextUnlock,
        monthly_exchanges_used: gradeInfo?.monthly_exchanges_used || 0,
        monthly_exchanges_reset_at: gradeInfo?.monthly_exchanges_reset_at,
        recent_transactions: recentTransactions || []
      }
    });

  } catch (error) {
    console.error('포인트 상태 조회 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
