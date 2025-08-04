const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4OTMxMiwiZXhwIjoyMDU3MTY1MzEyfQ.leaLPRZDAN8zS1F2ijIZSp0HrBA7A5Fqgef_6QSa_S4'
);

async function runMigration() {
  try {
    console.log('마이그레이션 시작...');
    
    // community_post 테이블에 scraped_data 컬럼 추가
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.community_post 
        ADD COLUMN IF NOT EXISTS scraped_data JSONB;
      `
    });

    if (alterError) {
      console.error('컬럼 추가 오류:', alterError);
      return;
    }

    console.log('✅ scraped_data 컬럼이 성공적으로 추가되었습니다.');

    // 인덱스 생성
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_community_post_scraped_data 
        ON public.community_post USING GIN (scraped_data);
      `
    });

    if (indexError) {
      console.error('인덱스 생성 오류:', indexError);
    } else {
      console.log('✅ 인덱스가 성공적으로 생성되었습니다.');
    }

    // 뷰 생성
    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE VIEW public.scraped_community_posts AS
        SELECT * FROM public.community_post 
        WHERE scraped_data IS NOT NULL;
      `
    });

    if (viewError) {
      console.error('뷰 생성 오류:', viewError);
    } else {
      console.log('✅ 뷰가 성공적으로 생성되었습니다.');
    }

    console.log('🎉 마이그레이션이 완료되었습니다!');

  } catch (error) {
    console.error('마이그레이션 오류:', error);
  }
}

runMigration(); 