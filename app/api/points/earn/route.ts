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
      source, 
      source_id, 
      amount, 
      verification_required = true 
    } = await request.json();

    if (!source || !amount) {
      return NextResponse.json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 포인트 적립 로직
    const now = new Date();
    const lockUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48시간 후
    const expiresAt = new Date(now.getTime() + 4 * 30 * 24 * 60 * 60 * 1000); // 4개월 후

    // 포인트 거래 내역 생성
    const { data: transaction, error: transactionError } = await supabase
      .from('point_transactions')
      .insert([
        {
          user_id: user.id,
          transaction_type: 'earned',
          amount: amount,
          source: source,
          source_id: source_id,
          status: verification_required ? 'locked' : 'unlocked',
          lock_until: verification_required ? lockUntil.toISOString() : null,
          unlocked_at: verification_required ? null : now.toISOString(),
          expires_at: expiresAt.toISOString(),
        }
      ])
      .select()
      .single();

    if (transactionError) {
      console.error('포인트 거래 생성 오류:', transactionError);
      return NextResponse.json({ success: false, error: '포인트 적립에 실패했습니다.' }, { status: 500 });
    }

    // 사용자의 총 포인트 업데이트 (즉시 잔고에 반영)
    // 먼저 현재 포인트 조회
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();

    if (profileFetchError) {
      console.error('프로필 조회 오류:', profileFetchError);
      // 거래는 생성되었지만 프로필 조회 실패 시 롤백
      await supabase
        .from('point_transactions')
        .delete()
        .eq('id', transaction.id);
      
      return NextResponse.json({ success: false, error: '포인트 적립에 실패했습니다.' }, { status: 500 });
    }

    // 포인트 증가
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        points: (currentProfile?.points || 0) + amount 
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('프로필 포인트 업데이트 오류:', profileError);
      // 거래는 생성되었지만 프로필 업데이트 실패 시 롤백
      await supabase
        .from('point_transactions')
        .delete()
        .eq('id', transaction.id);
      
      return NextResponse.json({ success: false, error: '포인트 적립에 실패했습니다.' }, { status: 500 });
    }

    // 등급 업데이트 (비동기) - 실패해도 포인트 적립은 성공으로 처리
    try {
      // user_grades 테이블에 사용자 등급 정보가 없으면 생성
      const { error: gradeUpsertError } = await supabase
        .from('user_grades')
        .upsert({
          user_id: user.id,
          grade: 'bronze',
          approved_reviews_60d: 0,
          avg_rating_60d: 0,
          deep_reviews_60d: 0,
          featured_count_60d: 0,
          noshow_warnings: 0,
          monthly_exchanges_used: 0,
          monthly_exchanges_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id' });

      if (gradeUpsertError) {
        console.error('사용자 등급 정보 생성/업데이트 오류:', gradeUpsertError);
      }
    } catch (error) {
      console.error('등급 업데이트 오류:', error);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        transaction_id: transaction.id,
        amount: amount,
        status: verification_required ? 'locked' : 'unlocked',
        lock_until: verification_required ? lockUntil.toISOString() : null,
        message: verification_required 
          ? `${amount}P 적립(잠금 48시간) — 검증 완료 후 자동 해제됩니다.`
          : `${amount}P 적립 완료`
      }
    });

  } catch (error) {
    console.error('포인트 적립 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
