import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  console.log('=== 통계 API 호출됨 ===');
  
  try {
    const supabase = createClient();
    console.log('Supabase client created');

    // 1. 총 게시글 수
    const { count: postsCount, error: postsError } = await supabase
      .from('community_post')
      .select('id', { count: 'exact', head: true });
    console.log('Posts count:', postsCount, 'Error:', postsError);

    // 2. 신고 수 (여러 테이블 시도)
    let reportsCount = 0;
    try {
      const { count } = await supabase.from('post_reports_uuid').select('id', { count: 'exact', head: true });
      reportsCount = count || 0;
      console.log('Reports (uuid):', reportsCount);
    } catch {
      try {
        const { count } = await supabase.from('post_reports').select('id', { count: 'exact', head: true });
        reportsCount = count || 0;
        console.log('Reports (fallback):', reportsCount);
      } catch {
        reportsCount = 0;
        console.log('No reports tables found');
      }
    }

    // 3. 포인트 검토 대기 (승인된 리뷰 제외)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const { data: recentReviews, error: pointsError } = await supabase
      .from('exhibition_review')
      .select('id, user_id')
      .gte('created_at', fortyEightHoursAgo.toISOString());
    
    // 이미 처리된 (승인/거부) 리뷰 ID들 조회
    const { data: processedTransactions } = await supabase
      .from('point_transactions')
      .select('reference_id')
      .eq('reference_type', 'exhibition_review')
      .in('status', ['completed', 'rejected']);

    const processedReviewIds = new Set((processedTransactions || []).map(t => t.reference_id));
    
    // 아직 처리되지 않은 리뷰만 필터링
    const pendingReviews = (recentReviews || []).filter(review => !processedReviewIds.has(review.id));
    
    // 검토 대기 사용자 수 계산
    const userGroups = {};
    pendingReviews.forEach(review => {
      userGroups[review.user_id] = (userGroups[review.user_id] || 0) + 500;
    });
    const pendingUsersCount = Object.keys(userGroups).length;
    
    console.log('Points 검토 대기 (API):', { 사용자수: pendingUsersCount, 총리뷰: recentReviews?.length, 승인제외리뷰: pendingReviews.length, 'Error': pointsError });

    // 4. 작가 승인 대기
    const { count: artistsCount, error: artistsError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('isArtist', true)
      .eq('isArtistApproval', false);
    console.log('Artists count:', artistsCount, 'Error:', artistsError);

    // 5. 기자단 승인 대기 (안전)
    let journalistsCount = 0;
    try {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_journalist_approved', false);
      journalistsCount = count || 0;
      console.log('Journalists count:', journalistsCount);
    } catch (e) {
      console.log('Journalists query failed (column may not exist):', e);
      journalistsCount = 0;
    }

    // 6. 오늘 댓글
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: commentsCount, error: commentsError } = await supabase
      .from('community_comments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());
    console.log('Comments count:', commentsCount, 'Error:', commentsError);

    const stats = {
      posts: postsCount || 0,
      reports: reportsCount || 0,
      pendingPoints: pendingUsersCount || 0,
      artistsPending: artistsCount || 0,
      journalistsPending: journalistsCount || 0,
      commentsToday: commentsCount || 0,
    };

    console.log('Final stats:', stats);
    return NextResponse.json({ success: true, data: stats });

  } catch (e) {
    console.error('Stats API error:', e);
    return NextResponse.json({ 
      success: false, 
      error: e.message,
      data: { posts: 0, reports: 0, pendingPoints: 0, artistsPending: 0, journalistsPending: 0, commentsToday: 0 } 
    });
  }
}
