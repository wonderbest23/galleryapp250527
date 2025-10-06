const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillReviewPoints() {
  console.log('=== 기존 리뷰 포인트 백필 시작 ===');
  
  try {
    // 1. 모든 리뷰 조회
    const { data: reviews, error: reviewError } = await supabase
      .from('exhibition_review')
      .select('id, user_id, created_at, rating, description')
      .order('created_at', { ascending: true });
    
    if (reviewError) {
      console.error('리뷰 조회 오류:', reviewError);
      return;
    }
    
    console.log(`총 ${reviews.length}개의 리뷰를 발견했습니다.`);
    
    // 2. 사용자별 리뷰 개수 계산
    const userReviewCounts = {};
    reviews.forEach(review => {
      userReviewCounts[review.user_id] = (userReviewCounts[review.user_id] || 0) + 1;
    });
    
    console.log('사용자별 리뷰 개수:', userReviewCounts);
    
    // 3. 각 사용자별로 포인트 계산 및 업데이트
    for (const [userId, reviewCount] of Object.entries(userReviewCounts)) {
      const totalPoints = reviewCount * 500; // 리뷰당 500P
      
      console.log(`\n사용자 ${userId}: ${reviewCount}개 리뷰 → ${totalPoints}P`);
      
      // 4. profiles 테이블의 points 컬럼 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: totalPoints })
        .eq('id', userId);
      
      if (updateError) {
        console.error(`사용자 ${userId} 포인트 업데이트 오류:`, updateError);
      } else {
        console.log(`✅ 사용자 ${userId} 포인트 업데이트 완료: ${totalPoints}P`);
      }
    }
    
    console.log('\n=== 포인트 백필 완료 ===');
    
    // 5. 결과 확인
    const { data: updatedProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('id, points, full_name')
      .gt('points', 0);
    
    if (checkError) {
      console.error('결과 확인 오류:', checkError);
    } else {
      console.log('\n업데이트된 사용자들:');
      updatedProfiles.forEach(profile => {
        console.log(`- ${profile.full_name || profile.id}: ${profile.points}P`);
      });
    }
    
  } catch (error) {
    console.error('백필 과정에서 오류 발생:', error);
  }
}

backfillReviewPoints().catch(console.error);

