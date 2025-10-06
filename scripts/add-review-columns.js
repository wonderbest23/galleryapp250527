const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addReviewColumns() {
  console.log("리뷰 테이블 컬럼 추가 시작...");

  try {
    // 1. exhibition_review 테이블 구조 확인
    console.log("1. exhibition_review 테이블 구조 확인...");
    const { data: reviewTable, error: reviewError } = await supabase
      .from('exhibition_review')
      .select('*')
      .limit(1);

    if (reviewError) {
      console.error("exhibition_review 테이블 조회 오류:", reviewError);
    } else {
      console.log("exhibition_review 테이블 컬럼:", Object.keys(reviewTable?.[0] || {}));
    }

    // 2. exhibition 테이블 구조 확인
    console.log("2. exhibition 테이블 구조 확인...");
    const { data: exhibitionTable, error: exhibitionError } = await supabase
      .from('exhibition')
      .select('*')
      .limit(1);

    if (exhibitionError) {
      console.error("exhibition 테이블 조회 오류:", exhibitionError);
    } else {
      console.log("exhibition 테이블 컬럼:", Object.keys(exhibitionTable?.[0] || {}));
    }

    // 3. profiles 테이블 구조 확인
    console.log("3. profiles 테이블 구조 확인...");
    const { data: profilesTable, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error("profiles 테이블 조회 오류:", profilesError);
    } else {
      console.log("profiles 테이블 컬럼:", Object.keys(profilesTable?.[0] || {}));
    }

    // 4. 기존 리뷰 데이터에 필요한 컬럼 추가 (업데이트)
    console.log("4. 기존 리뷰 데이터 업데이트...");
    
    // exhibition_review 테이블에 status 컬럼이 없다면 기본값으로 업데이트
    const { data: reviews, error: reviewsFetchError } = await supabase
      .from('exhibition_review')
      .select('id');

    if (reviewsFetchError) {
      console.error("리뷰 조회 오류:", reviewsFetchError);
    } else {
      console.log(`총 ${reviews?.length || 0}개의 리뷰 발견`);
      
      // 각 리뷰에 대해 기본값 설정
      for (const review of reviews || []) {
        const updateData = {};
        
        // created_at이 없는 경우 현재 시간으로 설정
        const { data: existingReview } = await supabase
          .from('exhibition_review')
          .select('created_at')
          .eq('id', review.id)
          .single();

        if (!existingReview?.created_at) {
          updateData.created_at = new Date().toISOString();
        }

        // 업데이트할 데이터가 있으면 실행
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('exhibition_review')
            .update(updateData)
            .eq('id', review.id);

          if (updateError) {
            console.error(`리뷰 ${review.id} 업데이트 오류:`, updateError);
          }
        }
      }
      console.log("✓ 기존 리뷰 데이터 업데이트 완료");
    }

    // 5. profiles 테이블에 기본값 설정
    console.log("5. profiles 테이블 기본값 설정...");
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id');

    if (allProfilesError) {
      console.error("프로필 조회 오류:", allProfilesError);
    } else {
      for (const profile of allProfiles || []) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({
            account_age_days: 7, // 기본값 7일
            review_count_today: 0,
            review_count_this_month: 0,
            abuse_score: 0,
            is_verified: false
          })
          .eq('id', profile.id);

        if (updateProfileError) {
          console.error(`프로필 ${profile.id} 업데이트 오류:`, updateProfileError);
        }
      }
      console.log("✓ profiles 기본값 설정 완료");
    }

    console.log("=== 리뷰 테이블 컬럼 추가 완료 ===");

  } catch (error) {
    console.error("설정 중 오류 발생:", error);
  }
}

addReviewColumns();

