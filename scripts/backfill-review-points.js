const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillReviewPoints() {
  try {
    console.log('기존 리뷰 포인트 백필 시작...');

    // 기존 리뷰 중 포인트가 적립되지 않은 것들 조회
    const { data: reviews, error: reviewsError } = await supabase
      .from('exhibition_review')
      .select('id, user_id, created_at')
      .order('created_at', { ascending: true });

    if (reviewsError) {
      console.error('리뷰 조회 오류:', reviewsError);
      return;
    }

    console.log(`총 ${reviews.length}개의 리뷰 발견`);

    let processedCount = 0;
    let errorCount = 0;

    for (const review of reviews) {
      try {
        // 이미 포인트가 적립된 리뷰인지 확인
        const { data: existingPoint, error: pointCheckError } = await supabase
          .from('point_transactions')
          .select('id')
          .eq('source', 'review')
          .eq('source_id', review.id)
          .single();

        if (pointCheckError && pointCheckError.code !== 'PGRST116') {
          console.error(`리뷰 ${review.id} 포인트 확인 오류:`, pointCheckError);
          errorCount++;
          continue;
        }

        // 이미 포인트가 적립된 경우 건너뛰기
        if (existingPoint) {
          console.log(`리뷰 ${review.id}는 이미 포인트가 적립됨`);
          continue;
        }

        // 포인트 적립 API 호출
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/points/earn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'review',
            source_id: review.id,
            amount: 500,
            verification_required: true
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log(`리뷰 ${review.id} 포인트 적립 완료: 500P`);
          processedCount++;
        } else {
          console.error(`리뷰 ${review.id} 포인트 적립 실패:`, result.error);
          errorCount++;
        }

        // API 호출 간격 조절 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`리뷰 ${review.id} 처리 중 오류:`, error);
        errorCount++;
      }
    }

    console.log(`\n백필 완료:`);
    console.log(`- 처리된 리뷰: ${processedCount}개`);
    console.log(`- 오류 발생: ${errorCount}개`);
    console.log(`- 총 리뷰: ${reviews.length}개`);

  } catch (error) {
    console.error('백필 프로세스 오류:', error);
  }
}

// 사용자 등급 업데이트
async function updateUserGrades() {
  try {
    console.log('\n사용자 등급 업데이트 시작...');

    // 모든 사용자 조회
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) {
      console.error('사용자 조회 오류:', usersError);
      return;
    }

    console.log(`총 ${users.length}명의 사용자 발견`);

    let updatedCount = 0;

    for (const user of users) {
      try {
        // 사용자 등급 업데이트 함수 호출
        const { error: gradeError } = await supabase.rpc('update_user_grade', {
          p_user_id: user.id
        });

        if (gradeError) {
          console.error(`사용자 ${user.id} 등급 업데이트 오류:`, gradeError);
        } else {
          console.log(`사용자 ${user.id} 등급 업데이트 완료`);
          updatedCount++;
        }

        // API 호출 간격 조절
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error(`사용자 ${user.id} 처리 중 오류:`, error);
      }
    }

    console.log(`\n등급 업데이트 완료: ${updatedCount}명`);

  } catch (error) {
    console.error('등급 업데이트 프로세스 오류:', error);
  }
}

// 메인 실행
async function main() {
  console.log('=== 기존 리뷰 포인트 백필 및 등급 업데이트 ===\n');
  
  await backfillReviewPoints();
  await updateUserGrades();
  
  console.log('\n=== 모든 작업 완료 ===');
}

main().catch(console.error);
