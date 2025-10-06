const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupReviewAbusePrevention() {
  console.log("리뷰 어뷰징 방지 시스템 설정 시작...");

  try {
    // 1. review_activity_logs 테이블 생성
    console.log("1. review_activity_logs 테이블 생성 중...");
    const { error: logsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS review_activity_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          review_id UUID REFERENCES exhibition_review(id) ON DELETE CASCADE,
          exhibition_id UUID REFERENCES exhibition(id) ON DELETE CASCADE,
          action TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (logsTableError) {
      console.error("review_activity_logs 테이블 생성 오류:", logsTableError);
    } else {
      console.log("✓ review_activity_logs 테이블 생성 완료");
    }

    // 2. exhibition_review 테이블에 컬럼 추가
    console.log("2. exhibition_review 테이블 컬럼 추가 중...");
    const { error: reviewColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE exhibition_review 
        ADD COLUMN IF NOT EXISTS is_custom_review BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS ip_address TEXT,
        ADD COLUMN IF NOT EXISTS user_agent TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      `
    });

    if (reviewColumnsError) {
      console.error("exhibition_review 컬럼 추가 오류:", reviewColumnsError);
    } else {
      console.log("✓ exhibition_review 컬럼 추가 완료");
    }

    // 3. exhibition 테이블에 컬럼 추가
    console.log("3. exhibition 테이블 컬럼 추가 중...");
    const { error: exhibitionColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE exhibition 
        ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('pending_approval', 'active', 'inactive', 'rejected'));
      `
    });

    if (exhibitionColumnsError) {
      console.error("exhibition 컬럼 추가 오류:", exhibitionColumnsError);
    } else {
      console.log("✓ exhibition 컬럼 추가 완료");
    }

    // 4. profiles 테이블에 컬럼 추가
    console.log("4. profiles 테이블 컬럼 추가 중...");
    const { error: profilesColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS account_age_days INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_count_today INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS review_count_this_month INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_review_date DATE,
        ADD COLUMN IF NOT EXISTS abuse_score INTEGER DEFAULT 0;
      `
    });

    if (profilesColumnsError) {
      console.error("profiles 컬럼 추가 오류:", profilesColumnsError);
    } else {
      console.log("✓ profiles 컬럼 추가 완료");
    }

    // 5. 인덱스 생성
    console.log("5. 인덱스 생성 중...");
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_exhibition_review_user_exhibition ON exhibition_review(user_id, exhibition_id);
        CREATE INDEX IF NOT EXISTS idx_exhibition_review_user_created_at ON exhibition_review(user_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_exhibition_review_status ON exhibition_review(status);
        CREATE INDEX IF NOT EXISTS idx_review_activity_logs_user_created_at ON review_activity_logs(user_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_review_activity_logs_ip_created_at ON review_activity_logs(ip_address, created_at);
        CREATE INDEX IF NOT EXISTS idx_exhibition_is_custom ON exhibition(is_custom);
        CREATE INDEX IF NOT EXISTS idx_exhibition_status ON exhibition(status);
      `
    });

    if (indexesError) {
      console.error("인덱스 생성 오류:", indexesError);
    } else {
      console.log("✓ 인덱스 생성 완료");
    }

    // 6. 기존 데이터 업데이트
    console.log("6. 기존 데이터 업데이트 중...");
    
    // exhibition_review의 created_at 업데이트
    const { error: updateReviewDatesError } = await supabase
      .from('exhibition_review')
      .update({ 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .is('created_at', null);

    if (updateReviewDatesError) {
      console.error("exhibition_review 날짜 업데이트 오류:", updateReviewDatesError);
    } else {
      console.log("✓ exhibition_review 날짜 업데이트 완료");
    }

    // profiles의 account_age_days 업데이트
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error("프로필 조회 오류:", profilesError);
    } else {
      for (const profile of profiles || []) {
        // 간단한 계정 나이 계산 (7일로 설정)
        await supabase
          .from('profiles')
          .update({ account_age_days: 7 })
          .eq('id', profile.id);
      }
      console.log("✓ profiles 계정 나이 업데이트 완료");
    }

    console.log("=== 리뷰 어뷰징 방지 시스템 설정 완료 ===");

  } catch (error) {
    console.error("설정 중 오류 발생:", error);
  }
}

setupReviewAbusePrevention();

