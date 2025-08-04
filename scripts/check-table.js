const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4OTMxMiwiZXhwIjoyMDU3MTY1MzEyfQ.leaLPRZDAN8zS1F2ijIZSp0HrBA7A5Fqgef_6QSa_S4'
);

async function checkTable() {
  try {
    console.log('테이블 구조 확인 중...');
    
    // community_post 테이블에서 데이터 하나 조회
    const { data, error } = await supabase
      .from('community_post')
      .select('*')
      .limit(1);

    if (error) {
      console.error('테이블 조회 오류:', error);
      return;
    }

    console.log('✅ community_post 테이블 조회 성공');
    console.log('테이블 구조:', Object.keys(data[0] || {}));
    
    // scraped_posts 테이블도 확인
    const { data: scrapedData, error: scrapedError } = await supabase
      .from('scraped_posts')
      .select('*')
      .limit(1);

    if (scrapedError) {
      console.error('scraped_posts 테이블 조회 오류:', scrapedError);
    } else {
      console.log('✅ scraped_posts 테이블 조회 성공');
      console.log('scraped_posts 구조:', Object.keys(scrapedData[0] || {}));
    }

  } catch (error) {
    console.error('오류:', error);
  }
}

checkTable(); 