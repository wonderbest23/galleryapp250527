import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { exhibition_id, visit_date } = await request.json();

    if (!exhibition_id) {
      return NextResponse.json({ success: false, error: '전시회 정보가 필요합니다.' }, { status: 400 });
    }

    // 사용자 등급 정보 조회
    const { data: gradeInfo } = await supabase
      .from('user_grades')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const currentGrade = gradeInfo?.grade || 'bronze';
    
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

    const requiredPoints = getExchangePoints(currentGrade);

    // 사용 가능 포인트 조회
    const { data: availablePoints } = await supabase.rpc('get_available_points', {
      p_user_id: user.id
    });

    if ((availablePoints || 0) < requiredPoints) {
      return NextResponse.json({ 
        success: false, 
        error: `포인트가 부족합니다. 필요: ${requiredPoints}P, 보유: ${availablePoints || 0}P` 
      }, { status: 400 });
    }

    // 월 교환 횟수 체크
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 이번 달 교환 횟수 조회
    const { data: monthlyExchanges } = await supabase
      .from('ticket_exchanges')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    const monthlyExchangeCount = monthlyExchanges?.length || 0;

    // 등급별 월 최대 교환 횟수
    const getMaxMonthlyExchanges = (grade: string) => {
      switch (grade) {
        case 'bronze': return 2;
        case 'silver': return 3;
        case 'gold': return 4;
        case 'platinum': return 4;
        default: return 2;
      }
    };

    const maxMonthlyExchanges = getMaxMonthlyExchanges(currentGrade);

    if (monthlyExchangeCount >= maxMonthlyExchanges) {
      return NextResponse.json({ 
        success: false, 
        error: `월 최대 교환 횟수(${maxMonthlyExchanges}회)를 초과했습니다.` 
      }, { status: 400 });
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

    // 포인트 차감 거래 생성
    const { data: spendTransaction, error: spendError } = await supabase
      .from('point_transactions')
      .insert([
        {
          user_id: user.id,
          transaction_type: 'spent',
          amount: -requiredPoints,
          source: 'ticket_purchase',
          source_id: exhibition_id,
          status: 'unlocked',
          unlocked_at: now.toISOString(),
          expires_at: now.toISOString(), // 사용된 포인트는 만료 없음
        }
      ])
      .select()
      .single();

    if (spendError) {
      console.error('포인트 차감 오류:', spendError);
      return NextResponse.json({ success: false, error: '포인트 차감에 실패했습니다.' }, { status: 500 });
    }

    // 티켓 교환 내역 생성
    const { data: exchange, error: exchangeError } = await supabase
      .from('ticket_exchanges')
      .insert([
        {
          user_id: user.id,
          exhibition_id: exhibition_id,
          points_spent: requiredPoints,
          exchange_date: now.toISOString(),
          visit_date: visit_date || null,
          status: 'exchanged',
        }
      ])
      .select()
      .single();

    if (exchangeError) {
      console.error('티켓 교환 내역 생성 오류:', exchangeError);
      // 포인트 차감 롤백
      await supabase
        .from('point_transactions')
        .delete()
        .eq('id', spendTransaction.id);
      
      return NextResponse.json({ success: false, error: '티켓 교환에 실패했습니다.' }, { status: 500 });
    }

    // 프로필 포인트 차감
    const { error: profileError } = await supabase.rpc('decrement_points', {
      user_id: user.id,
      points: requiredPoints
    });

    if (profileError) {
      console.error('프로필 포인트 차감 오류:', profileError);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        exchange_id: exchange.id,
        exhibition_title: exhibition.contents,
        points_spent: requiredPoints,
        remaining_points: (availablePoints || 0) - requiredPoints,
        monthly_exchanges_used: monthlyExchangeCount + 1,
        message: `티켓 교환 완료! ${requiredPoints}P가 차감되었습니다.`
      }
    });

  } catch (error) {
    console.error('티켓 교환 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
