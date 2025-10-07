const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('에러 모니터링 테이블 마이그레이션 시작...');

    // 에러 로그 테이블 생성
    const { error: errorLogsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS error_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          error_type VARCHAR(255) NOT NULL,
          error_message TEXT NOT NULL,
          error_stack TEXT,
          error_url TEXT,
          user_agent TEXT,
          user_id UUID,
          session_id VARCHAR(255),
          severity VARCHAR(50) DEFAULT 'error' CHECK (severity IN ('critical', 'error', 'warning', 'info')),
          category VARCHAR(100) DEFAULT 'other',
          component VARCHAR(255),
          action VARCHAR(255),
          metadata JSONB,
          resolved BOOLEAN DEFAULT FALSE,
          resolved_at TIMESTAMPTZ,
          resolution_notes TEXT,
          resolved_by VARCHAR(255),
          fix_applied TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (errorLogsError) {
      console.error('에러 로그 테이블 생성 실패:', errorLogsError);
    } else {
      console.log('✅ 에러 로그 테이블 생성 완료');
    }

    // AI 리포트 테이블 생성
    const { error: aiReportsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ai_reports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          report_type VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          summary TEXT,
          content JSONB,
          recommendations JSONB,
          date_range INTEGER DEFAULT 7,
          generated_at TIMESTAMPTZ DEFAULT NOW(),
          status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (aiReportsError) {
      console.error('AI 리포트 테이블 생성 실패:', aiReportsError);
    } else {
      console.log('✅ AI 리포트 테이블 생성 완료');
    }

    // 관리자 알림 테이블 생성
    const { error: adminNotificationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admin_notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          type VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          data JSONB,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (adminNotificationsError) {
      console.error('관리자 알림 테이블 생성 실패:', adminNotificationsError);
    } else {
      console.log('✅ 관리자 알림 테이블 생성 완료');
    }

    // 사용자 세션 테이블 생성
    const { error: userSessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID,
          session_token VARCHAR(255) NOT NULL,
          ip_address INET,
          user_agent TEXT,
          login_successful BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ
        );
      `
    });

    if (userSessionsError) {
      console.error('사용자 세션 테이블 생성 실패:', userSessionsError);
    } else {
      console.log('✅ 사용자 세션 테이블 생성 완료');
    }

    // 사용자 피드백 테이블 생성
    const { error: userFeedbackError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_feedback (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID,
          feedback_type VARCHAR(100) NOT NULL,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          page_url TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (userFeedbackError) {
      console.error('사용자 피드백 테이블 생성 실패:', userFeedbackError);
    } else {
      console.log('✅ 사용자 피드백 테이블 생성 완료');
    }

    // 인덱스 생성
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
        CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
        CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
        CREATE INDEX IF NOT EXISTS idx_ai_reports_generated_at ON ai_reports(generated_at);
        CREATE INDEX IF NOT EXISTS idx_ai_reports_type ON ai_reports(report_type);
      `
    });

    if (indexError) {
      console.error('인덱스 생성 실패:', indexError);
    } else {
      console.log('✅ 인덱스 생성 완료');
    }

    console.log('🎉 에러 모니터링 마이그레이션 완료!');

  } catch (error) {
    console.error('마이그레이션 실행 중 오류:', error);
  }
}

applyMigration();
