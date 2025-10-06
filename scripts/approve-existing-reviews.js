const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function approveExistingReviews() {
  try {
    console.log('기존 리뷰들을 승인 처리 중...');
    
    // 1. 현재 exhibition_review 테이블의 모든 리뷰 확인
    const { data: allReviews, error: fetchError } = await supabase
      .from('exhibition_review')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('리뷰 조회 오류:', fetchError);
      return;
    }

    console.log(`총 ${allReviews.length}개의 리뷰를 찾았습니다.`);

    if (allReviews.length === 0) {
      console.log('승인할 리뷰가 없습니다.');
      return;
    }

    // 2. 각 리뷰의 상태 확인 및 승인 처리
    let approvedCount = 0;
    let alreadyApprovedCount = 0;

    for (const review of allReviews) {
      console.log(`리뷰 ID: ${review.id}, 현재 상태: ${review.status || 'null'}`);
      
      // status가 'approved'가 아닌 경우에만 업데이트
      if (review.status !== 'approved') {
        const { error: updateError } = await supabase
          .from('exhibition_review')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', review.id);

        if (updateError) {
          console.error(`리뷰 ${review.id} 승인 처리 오류:`, updateError);
        } else {
          console.log(`✅ 리뷰 ${review.id} 승인 처리 완료`);
          approvedCount++;
        }
      } else {
        console.log(`⏭️ 리뷰 ${review.id}는 이미 승인됨`);
        alreadyApprovedCount++;
      }
    }

    console.log('\n=== 승인 처리 결과 ===');
    console.log(`새로 승인된 리뷰: ${approvedCount}개`);
    console.log(`이미 승인된 리뷰: ${alreadyApprovedCount}개`);
    console.log(`총 리뷰: ${allReviews.length}개`);

    // 3. 승인된 리뷰들 다시 조회하여 확인
    const { data: approvedReviews, error: verifyError } = await supabase
      .from('exhibition_review')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('승인된 리뷰 확인 오류:', verifyError);
    } else {
      console.log(`\n현재 승인된 리뷰: ${approvedReviews.length}개`);
      
      // 승인된 리뷰들의 정보 출력
      approvedReviews.forEach((review, index) => {
        console.log(`${index + 1}. ID: ${review.id}, 평점: ${review.rating}, 내용: ${review.description?.substring(0, 50)}...`);
      });
    }

  } catch (error) {
    console.error('리뷰 승인 처리 중 오류 발생:', error);
  }
}

// 스크립트 실행
approveExistingReviews();
