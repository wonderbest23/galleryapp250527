require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase environment variables are not set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupPointReviewSystem() {
  console.log('=== 포인트 검토 시스템 설정 시작 ===');

  try {
    // 1. 포인트 검토 요청 테이블 생성
    console.log('1. 포인트 검토 요청 테이블 생성 중...');
    const { error: requestsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS point_review_requests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            review_id UUID REFERENCES exhibition_review(id) ON DELETE CASCADE,
            points INTEGER NOT NULL DEFAULT 500,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 're_review_requested')),
            admin_id UUID REFERENCES auth.users(id),
            admin_comment TEXT,
            rejection_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            processed_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (requestsError) {
      console.error('포인트 검토 요청 테이블 생성 오류:', requestsError);
    } else {
      console.log('✅ 포인트 검토 요청 테이블 생성 완료');
    }

    // 2. 포인트 알림 테이블 생성
    console.log('2. 포인트 알림 테이블 생성 중...');
    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS point_notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL CHECK (type IN ('point_approved', 'point_rejected', 're_review_requested')),
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            point_review_request_id UUID REFERENCES point_review_requests(id) ON DELETE CASCADE,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (notificationsError) {
      console.error('포인트 알림 테이블 생성 오류:', notificationsError);
    } else {
      console.log('✅ 포인트 알림 테이블 생성 완료');
    }

    // 3. 포인트 거래 내역 테이블 생성
    console.log('3. 포인트 거래 내역 테이블 생성 중...');
    const { error: transactionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS point_transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL CHECK (type IN ('earn', 'spend', 'refund')),
            amount INTEGER NOT NULL,
            description TEXT,
            reference_id UUID,
            reference_type VARCHAR(50),
            status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (transactionsError) {
      console.error('포인트 거래 내역 테이블 생성 오류:', transactionsError);
    } else {
      console.log('✅ 포인트 거래 내역 테이블 생성 완료');
    }

    // 4. 인덱스 생성
    console.log('4. 인덱스 생성 중...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_point_review_requests_user_id ON point_review_requests(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_point_review_requests_status ON point_review_requests(status);',
      'CREATE INDEX IF NOT EXISTS idx_point_review_requests_created_at ON point_review_requests(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_point_notifications_user_id ON point_notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_point_notifications_is_read ON point_notifications(is_read);',
      'CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);'
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (indexError) {
        console.error('인덱스 생성 오류:', indexError);
      }
    }
    console.log('✅ 인덱스 생성 완료');

    // 5. RLS 정책 설정
    console.log('5. RLS 정책 설정 중...');
    const policies = [
      'ALTER TABLE point_review_requests ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE point_notifications ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY IF NOT EXISTS "Users can view their own point review requests" ON point_review_requests
         FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Admins can view all point review requests" ON point_review_requests
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM profiles 
             WHERE profiles.id = auth.uid() 
             AND profiles.is_admin = true
           )
         );`,
      `CREATE POLICY IF NOT EXISTS "Users can view their own notifications" ON point_notifications
         FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Admins can manage all notifications" ON point_notifications
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM profiles 
             WHERE profiles.id = auth.uid() 
             AND profiles.is_admin = true
           )
         );`,
      `CREATE POLICY IF NOT EXISTS "Users can view their own transactions" ON point_transactions
         FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Admins can manage all transactions" ON point_transactions
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM profiles 
             WHERE profiles.id = auth.uid() 
             AND profiles.is_admin = true
           )
         );`
    ];

    for (const policySql of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySql });
      if (policyError) {
        console.error('RLS 정책 설정 오류:', policyError);
      }
    }
    console.log('✅ RLS 정책 설정 완료');

    // 6. 함수 생성
    console.log('6. 함수 생성 중...');
    const functions = [
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
           NEW.updated_at = NOW();
           RETURN NEW;
       END;
       $$ language 'plpgsql';`,
      `CREATE TRIGGER IF NOT EXISTS update_point_review_requests_updated_at 
         BEFORE UPDATE ON point_review_requests 
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
      `CREATE OR REPLACE FUNCTION create_point_review_request(
         p_user_id UUID,
         p_review_id UUID,
         p_points INTEGER DEFAULT 500
       )
       RETURNS UUID AS $$
       DECLARE
         request_id UUID;
       BEGIN
         INSERT INTO point_review_requests (user_id, review_id, points)
         VALUES (p_user_id, p_review_id, p_points)
         RETURNING id INTO request_id;
         
         INSERT INTO point_notifications (user_id, type, title, message, point_review_request_id)
         VALUES (p_user_id, 'point_approved', '포인트 검토 요청', '리뷰 작성으로 인한 포인트 적립이 검토 중입니다.', request_id);
         
         RETURN request_id;
       END;
       $$ LANGUAGE plpgsql;`,
      `CREATE OR REPLACE FUNCTION process_point_review(
         p_request_id UUID,
         p_admin_id UUID,
         p_status VARCHAR(20),
         p_admin_comment TEXT DEFAULT NULL,
         p_rejection_reason TEXT DEFAULT NULL
       )
       RETURNS BOOLEAN AS $$
       DECLARE
         request_record RECORD;
       BEGIN
         SELECT * INTO request_record FROM point_review_requests WHERE id = p_request_id;
         
         IF NOT FOUND THEN
           RETURN FALSE;
         END IF;
         
         UPDATE point_review_requests 
         SET 
           status = p_status,
           admin_id = p_admin_id,
           admin_comment = p_admin_comment,
           rejection_reason = p_rejection_reason,
           processed_at = NOW()
         WHERE id = p_request_id;
         
         IF p_status = 'approved' THEN
           INSERT INTO point_transactions (user_id, type, amount, description, reference_id, reference_type)
           VALUES (request_record.user_id, 'earn', request_record.points, '리뷰 작성 포인트 적립', request_record.review_id, 'review');
           
           UPDATE profiles 
           SET points = points + request_record.points 
           WHERE id = request_record.user_id;
           
           INSERT INTO point_notifications (user_id, type, title, message, point_review_request_id)
           VALUES (request_record.user_id, 'point_approved', '포인트 적립 완료', 
                   CONCAT(request_record.points, 'P가 적립되었습니다.'), p_request_id);
                   
         ELSIF p_status = 'rejected' THEN
           INSERT INTO point_notifications (user_id, type, title, message, point_review_request_id)
           VALUES (request_record.user_id, 'point_rejected', '포인트 적립 거절', 
                   CONCAT('포인트 적립이 거절되었습니다. 사유: ', COALESCE(p_rejection_reason, '사유 없음')), p_request_id);
         END IF;
         
         RETURN TRUE;
       END;
       $$ LANGUAGE plpgsql;`,
      `CREATE OR REPLACE FUNCTION request_point_re_review(
         p_request_id UUID,
         p_user_id UUID,
         p_reason TEXT
       )
       RETURNS BOOLEAN AS $$
       DECLARE
         request_record RECORD;
       BEGIN
         SELECT * INTO request_record FROM point_review_requests 
         WHERE id = p_request_id AND user_id = p_user_id;
         
         IF NOT FOUND THEN
           RETURN FALSE;
         END IF;
         
         UPDATE point_review_requests 
         SET 
           status = 're_review_requested',
           rejection_reason = p_reason,
           processed_at = NULL,
           admin_id = NULL,
           admin_comment = NULL
         WHERE id = p_request_id;
         
         INSERT INTO point_notifications (user_id, type, title, message, point_review_request_id)
         VALUES (p_user_id, 're_review_requested', '재검토 요청', 
                 CONCAT('포인트 적립에 대한 재검토를 요청했습니다. 사유: ', p_reason), p_request_id);
         
         RETURN TRUE;
       END;
       $$ LANGUAGE plpgsql;`
    ];

    for (const functionSql of functions) {
      const { error: functionError } = await supabase.rpc('exec_sql', { sql: functionSql });
      if (functionError) {
        console.error('함수 생성 오류:', functionError);
      }
    }
    console.log('✅ 함수 생성 완료');

    console.log('\n=== 포인트 검토 시스템 설정 완료 ===');

  } catch (error) {
    console.error('설정 중 오류 발생:', error);
  }
}

setupPointReviewSystem();

