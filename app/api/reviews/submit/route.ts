import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: '로그인이 필요합니다.' 
      }, { status: 401 });
    }

    const { 
      exhibition_id,
      rating,
      description,
      proof_image,
      category = [],
      is_custom_review = false,
      custom_exhibition_data = null
    } = await request.json();

    // 필수 필드 검증 (exhibition_id는 custom review일 때 null일 수 있음)
    if (!rating || !description) {
      return NextResponse.json({ 
        success: false, 
        error: '필수 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    // 별점 검증
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        success: false, 
        error: '별점은 1~5 사이의 값이어야 합니다.' 
      }, { status: 400 });
    }

    // 리뷰 내용 길이 검증
    if (description.length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: '리뷰 내용은 최소 10자 이상이어야 합니다.' 
      }, { status: 400 });
    }

    if (description.length > 1000) {
      return NextResponse.json({ 
        success: false, 
        error: '리뷰 내용은 최대 1000자까지 작성할 수 있습니다.' 
      }, { status: 400 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. 중복 리뷰 최종 확인
    const { data: existingReview, error: duplicateError } = await supabase
      .from('exhibition_review')
      .select('id')
      .eq('exhibition_id', exhibition_id)
      .eq('user_id', user.id)
      .single();

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('중복 리뷰 확인 오류:', duplicateError);
      return NextResponse.json({ 
        success: false, 
        error: '리뷰 확인 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }

    if (existingReview) {
      return NextResponse.json({ 
        success: false, 
        error: '이미 이 전시회에 대한 리뷰를 작성하셨습니다.',
        code: 'DUPLICATE_REVIEW'
      }, { status: 400 });
    }

    // 2. 하루 리뷰 개수 최종 확인
    const { data: todayReviews, error: todayError } = await supabase
      .from('exhibition_review')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (todayError) {
      console.error('오늘 리뷰 개수 확인 오류:', todayError);
      return NextResponse.json({ 
        success: false, 
        error: '리뷰 개수 확인 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }

    if (todayReviews && todayReviews.length >= 2) {
      return NextResponse.json({ 
        success: false, 
        error: '하루에 최대 2개의 리뷰만 작성할 수 있습니다.',
        code: 'DAILY_LIMIT_EXCEEDED'
      }, { status: 400 });
    }

    // 3. 월별 리뷰 개수 최종 확인
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const { data: monthReviews, error: monthError } = await supabase
      .from('exhibition_review')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', thisMonth.toISOString())
      .lt('created_at', nextMonth.toISOString());

    if (monthError) {
      console.error('월별 리뷰 개수 확인 오류:', monthError);
      return NextResponse.json({ 
        success: false, 
        error: '리뷰 개수 확인 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }

    if (monthReviews && monthReviews.length >= 20) {
      return NextResponse.json({ 
        success: false, 
        error: '한 달에 최대 20개의 리뷰만 작성할 수 있습니다.',
        code: 'MONTHLY_LIMIT_EXCEEDED'
      }, { status: 400 });
    }

    // 4. 사용자 이름 마스킹
    const maskedName = user.user_metadata?.name
      ? user.user_metadata.name.length > 1
        ? user.user_metadata.name[0] + '**'
        : user.user_metadata.name
      : user.email && user.email.split('@')[0]?.length > 1
        ? user.email.split('@')[0][0] + '**'
        : '익명';

    // 5. 리뷰 데이터 준비 (기본 필드만)
    const reviewData = {
      rating: rating,
      description: description,
      name: maskedName,
      user_id: user.id,
      proof_image: proof_image || null
    };

    // exhibition_id는 있을 때만 추가
    if (exhibition_id) {
      reviewData.exhibition_id = exhibition_id;
    }

    // 6. 리뷰 저장
    console.log('리뷰 데이터:', reviewData);
    
    const { data: reviewResult, error: reviewError } = await supabase
      .from('exhibition_review')
      .insert([reviewData])
      .select()
      .single();

    if (reviewError) {
      console.error('리뷰 저장 오류:', reviewError);
      return NextResponse.json({ 
        success: false, 
        error: `리뷰 저장에 실패했습니다: ${reviewError.message}` 
      }, { status: 500 });
    }

    console.log('리뷰 저장 성공:', reviewResult);

    // Custom exhibition 데이터는 description에 포함하여 저장
    if (is_custom_review && custom_exhibition_data) {
      const customInfo = `[Custom Review] 전시회: ${custom_exhibition_data.title}, 갤러리: ${custom_exhibition_data.gallery}, 방문일: ${custom_exhibition_data.visit_date}`;
      
      // description에 custom 정보 추가
      const { error: updateError } = await supabase
        .from('exhibition_review')
        .update({ 
          description: `${customInfo}\n\n${description}` 
        })
        .eq('id', reviewResult.id);

      if (updateError) {
        console.error('Custom exhibition 정보 업데이트 오류:', updateError);
      }
    }

    // 7. 포인트 적립 (500P, 잠금 상태) - 직접 처리
    try {
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
            amount: 500,
            source: 'review',
            source_id: reviewResult.id,
            status: 'locked',
            lock_until: lockUntil.toISOString(),
            unlocked_at: null,
            expires_at: expiresAt.toISOString(),
          }
        ])
        .select()
        .single();

      if (transactionError) {
        console.error('포인트 거래 생성 오류:', transactionError);
      } else {
        console.log('포인트 적립 성공:', transaction);
      }
    } catch (pointError) {
      console.error('포인트 적립 오류:', pointError);
    }

    // 8. 리뷰 작성 로그 저장 (어뷰징 모니터링용) - 테이블이 없으므로 콘솔 로그로 대체
    console.log('리뷰 작성 활동:', {
      user_id: user.id,
      review_id: reviewResult.id,
      exhibition_id: exhibition_id,
      action: 'review_created',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: now.toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        review_id: reviewResult.id,
        message: '리뷰가 성공적으로 작성되었습니다.',
        points_earned: 500,
        daily_reviews_remaining: 2 - ((todayReviews?.length || 0) + 1),
        monthly_reviews_remaining: 20 - ((monthReviews?.length || 0) + 1)
      }
    });

  } catch (error) {
    console.error('리뷰 작성 서버 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
