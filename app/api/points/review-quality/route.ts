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
      review_id,
      quality_status,
      feedback,
      quality_score,
      is_deep_review = false,
      is_featured = false
    } = await request.json();

    if (!review_id || !quality_status) {
      return NextResponse.json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 리뷰 정보 조회
    const { data: review, error: reviewError } = await supabase
      .from('exhibition_review')
      .select('*, user_id')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ success: false, error: '리뷰 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 품질 검증 기록 생성/업데이트
    const { data: qualityCheck, error: qualityError } = await supabase
      .from('review_quality_checks')
      .upsert([
        {
          review_id: review_id,
          user_id: review.user_id,
          quality_status: quality_status,
          word_count: review.content?.length || 0,
          image_count: review.proof_image ? 1 : 0,
          is_deep_review: is_deep_review,
          is_featured: is_featured,
          quality_score: quality_score,
          feedback: feedback,
          checked_at: quality_status !== 'pending' ? new Date().toISOString() : null,
        }
      ], {
        onConflict: 'review_id'
      })
      .select()
      .single();

    if (qualityError) {
      console.error('품질 검증 기록 오류:', qualityError);
      return NextResponse.json({ success: false, error: '품질 검증에 실패했습니다.' }, { status: 500 });
    }

    // 품질 검증 통과 시 포인트 잠금 해제
    if (quality_status === 'approved') {
      // 기본 리뷰 포인트 (500P) 잠금 해제
      const { error: unlockBasicError } = await supabase
        .from('point_transactions')
        .update({
          status: 'unlocked',
          unlocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', review.user_id)
        .eq('source_id', review_id)
        .eq('source', 'review')
        .eq('status', 'locked');

      if (unlockBasicError) {
        console.error('기본 리뷰 포인트 해제 오류:', unlockBasicError);
      }

      // 심화 리뷰 보너스 포인트 (500P) 적립
      if (is_deep_review) {
        const { error: deepReviewError } = await supabase
          .from('point_transactions')
          .insert([
            {
              user_id: review.user_id,
              transaction_type: 'earned',
              amount: 500,
              source: 'deep_review',
              source_id: review_id,
              status: 'unlocked', // 심화 리뷰는 즉시 해제
              unlocked_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            }
          ]);

        if (!deepReviewError) {
          // 프로필 포인트 업데이트
          await supabase.rpc('increment_points', {
            user_id: review.user_id,
            points: 500
          });
        }
      }

      // 피처드 보너스 포인트 (500P) 적립
      if (is_featured) {
        const { error: featuredError } = await supabase
          .from('point_transactions')
          .insert([
            {
              user_id: review.user_id,
              transaction_type: 'earned',
              amount: 500,
              source: 'featured',
              source_id: review_id,
              status: 'unlocked', // 피처드는 즉시 해제
              unlocked_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            }
          ]);

        if (!featuredError) {
          // 프로필 포인트 업데이트
          await supabase.rpc('increment_points', {
            user_id: review.user_id,
            points: 500
          });
        }
      }

      // 사용자 등급 업데이트
      await supabase.rpc('update_user_grade', { p_user_id: review.user_id });
    }

    // 품질 검증 실패 시 포인트 취소
    if (quality_status === 'rejected') {
      const { error: cancelError } = await supabase
        .from('point_transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', review.user_id)
        .eq('source_id', review_id)
        .eq('source', 'review')
        .eq('status', 'locked');

      if (!cancelError) {
        // 프로필 포인트 차감
        await supabase.rpc('decrement_points', {
          user_id: review.user_id,
          points: 500
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        quality_check_id: qualityCheck.id,
        status: quality_status,
        message: quality_status === 'approved' 
          ? '리뷰 품질 검증 통과! 포인트가 해제되었습니다.'
          : quality_status === 'needs_revision'
          ? '리뷰 보완이 필요합니다. 수정 후 다시 제출해주세요.'
          : '리뷰 품질 검증 실패. 포인트가 취소되었습니다.'
      }
    });

  } catch (error) {
    console.error('리뷰 품질 검증 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
