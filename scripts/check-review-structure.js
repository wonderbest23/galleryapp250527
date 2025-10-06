const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviewStructure() {
  try {
    console.log('리뷰 데이터 구조 확인 중...');
    
    // exhibition_review 테이블의 구조 확인
    const { data: reviews, error } = await supabase
      .from('exhibition_review')
      .select(`
        *,
        exhibition:exhibition_id (
          id,
          contents,
          photo,
          status
        )
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('리뷰 조회 오류:', error);
      return;
    }

    console.log(`총 ${reviews.length}개의 승인된 리뷰를 찾았습니다.`);
    
    if (reviews.length > 0) {
      console.log('\n=== 첫 번째 리뷰 데이터 구조 ===');
      const firstReview = reviews[0];
      console.log('리뷰 ID:', firstReview.id);
      console.log('평점:', firstReview.rating);
      console.log('내용:', firstReview.description);
      console.log('작성자:', firstReview.author_name);
      console.log('작성일:', firstReview.created_at);
      console.log('증빙사진:', firstReview.proof_image);
      console.log('전시회 정보:', firstReview.exhibition);
      
      console.log('\n=== 모든 필드 확인 ===');
      Object.keys(firstReview).forEach(key => {
        console.log(`${key}: ${typeof firstReview[key]} - ${JSON.stringify(firstReview[key])}`);
      });
    }

  } catch (error) {
    console.error('리뷰 구조 확인 중 오류 발생:', error);
  }
}

// 스크립트 실행
checkReviewStructure();
