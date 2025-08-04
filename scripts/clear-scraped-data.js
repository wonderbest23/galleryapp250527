const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4OTMxMiwiZXhwIjoyMDU3MTY1MzEyfQ.leaLPRZDAN8zS1F2ijIZSp0HrBA7A5Fqgef_6QSa_S4'
);

async function clearScrapedData() {
  try {
    console.log('기존 스크랩 데이터 정리 중...');
    
    // 모든 스크랩 데이터 삭제
    const { data, error } = await supabase
      .from('scraped_posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 데이터 삭제
      .select();

    if (error) {
      console.error('데이터 삭제 오류:', error);
      return;
    }

    console.log('✅ 기존 스크랩 데이터가 모두 삭제되었습니다.');
    console.log('삭제된 데이터 수:', data?.length || 0);

  } catch (error) {
    console.error('오류:', error);
  }
}

clearScrapedData(); 