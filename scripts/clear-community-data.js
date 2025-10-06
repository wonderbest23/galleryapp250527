const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCommunityData() {
  try {
    console.log('커뮤니티 데이터 삭제 시작...');

    // 관련 테이블들 삭제 (외래키 순서 고려)
    const tables = [
      'community_comments',
      'community_likes', 
      'community_polls',
      'poll_votes',
      'community_post'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
      
      if (error) {
        console.error(`${table} 삭제 오류:`, error);
      } else {
        console.log(`${table} 데이터 삭제 완료`);
      }
    }

    console.log('커뮤니티 데이터 삭제 완료!');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

clearCommunityData();
