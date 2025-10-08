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

    const { exhibition_id } = await request.json();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. 같은 전시회에 대한 중복 리뷰 확인 (exhibition_id가 있을 때만)
    if (exhibition_id) {
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
    }

    // 2. 오늘 작성한 리뷰 개수 확인 (하루 최대 2개)
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
        code: 'DAILY_LIMIT_EXCEEDED',
        limit: 2,
        current: todayReviews.length
      }, { status: 400 });
    }

    // 3. 이번 달 작성한 리뷰 개수 확인 (한 달 최대 20개)
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
        code: 'MONTHLY_LIMIT_EXCEEDED',
        limit: 20,
        current: monthReviews.length
      }, { status: 400 });
    }

    // 4. 사용자 계정 생성일 확인 (7일 미만 신규 계정은 제한)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user.id);
    
    if (userError) {
      console.error('사용자 정보 확인 오류:', userError);
    } else if (userData?.user?.created_at) {
      const accountAge = Math.floor((Date.now() - new Date(userData.user.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (accountAge < 7) {
        return NextResponse.json({ 
          success: false, 
          error: '신규 계정은 7일 후부터 리뷰를 작성할 수 있습니다.',
          code: 'ACCOUNT_TOO_NEW',
          days_remaining: 7 - accountAge
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        can_write_review: true,
        daily_reviews: todayReviews?.length || 0,
        monthly_reviews: monthReviews?.length || 0,
        daily_limit: 2,
        monthly_limit: 20,
        daily_remaining: 2 - (todayReviews?.length || 0),
        monthly_remaining: 20 - (monthReviews?.length || 0)
      }
    });

  } catch (error) {
    console.error('리뷰 유효성 검사 서버 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
