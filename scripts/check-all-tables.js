const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4OTMxMiwiZXhwIjoyMDU3MTY1MzEyfQ.leaLPRZDAN8zS1F2ijIZSp0HrBA7A5Fqgef_6QSa_S4'
);

async function checkAllTables() {
  try {
    console.log('기존 테이블 구조 확인 중...');
    
    const tables = [
      'profiles',
      'community_post', 
      'exhibition',
      'art_store_product',
      'magazine',
      'gallery',
      'artist',
      'exhibition_review',
      'bookmark',
      'user_notifications'
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: 존재`);
          if (data && data.length > 0) {
            console.log(`   컬럼: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: 테이블 없음`);
      }
    }

    // 포인트 관련 테이블 확인
    console.log('\n포인트 관련 테이블 확인:');
    const pointTables = ['points', 'point_transactions', 'reward_shop', 'reward_purchases'];
    
    for (const tableName of pointTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: 존재`);
          if (data && data.length > 0) {
            console.log(`   컬럼: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: 테이블 없음`);
      }
    }

  } catch (error) {
    console.error('오류:', error);
  }
}

checkAllTables();
