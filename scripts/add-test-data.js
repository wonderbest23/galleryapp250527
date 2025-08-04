const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4OTMxMiwiZXhwIjoyMDU3MTY1MzEyfQ.leaLPRZDAN8zS1F2ijIZSp0HrBA7A5Fqgef_6QSa_S4'
);

async function addTestData() {
  try {
    console.log('테스트 데이터 추가 중...');
    
    const testData = [
      {
        source: 'visitSeoul',
        post_url: 'https://example.com/1',
        title: '테스트 전시 1',
        thumb_url: null,
        summary: '이것은 Visit Seoul에서 가져온 테스트 전시 정보입니다.',
        score: 0,
        used: false
      },
      {
        source: 'culturePortal',
        post_url: 'https://example.com/2',
        title: '테스트 전시 2',
        thumb_url: null,
        summary: '이것은 문화포털에서 가져온 테스트 전시 정보입니다.',
        score: 0,
        used: false
      },
      {
        source: 'artCenter',
        post_url: 'https://example.com/3',
        title: '테스트 전시 3',
        thumb_url: null,
        summary: '이것은 예술의전당에서 가져온 테스트 전시 정보입니다.',
        score: 0,
        used: false
      }
    ];

    const { data, error } = await supabase
      .from('scraped_posts')
      .insert(testData)
      .select();

    if (error) {
      console.error('테스트 데이터 추가 오류:', error);
      return;
    }

    console.log('✅ 테스트 데이터가 성공적으로 추가되었습니다.');
    console.log('추가된 데이터:', data);

  } catch (error) {
    console.error('오류:', error);
  }
}

addTestData(); 