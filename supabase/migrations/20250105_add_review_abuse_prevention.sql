-- 리뷰 어뷰징 방지를 위한 테이블 및 컬럼 추가

-- 1. 리뷰 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS review_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id BIGINT REFERENCES exhibition_review(id) ON DELETE CASCADE,
  exhibition_id BIGINT REFERENCES exhibition(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'review_created', 'review_updated', 'review_deleted'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. exhibition_review 테이블에 어뷰징 방지 컬럼 추가
ALTER TABLE exhibition_review 
ADD COLUMN IF NOT EXISTS is_custom_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. exhibition 테이블에 커스텀 전시회 관련 컬럼 추가
ALTER TABLE exhibition 
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('pending_approval', 'active', 'inactive', 'rejected'));

-- 4. profiles 테이블에 계정 신뢰도 관련 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_age_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_review_date DATE,
ADD COLUMN IF NOT EXISTS abuse_score INTEGER DEFAULT 0;

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_exhibition_review_user_exhibition ON exhibition_review(user_id, exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_review_user_created_at ON exhibition_review(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exhibition_review_status ON exhibition_review(status);
CREATE INDEX IF NOT EXISTS idx_review_activity_logs_user_created_at ON review_activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_review_activity_logs_ip_created_at ON review_activity_logs(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_exhibition_is_custom ON exhibition(is_custom);
CREATE INDEX IF NOT EXISTS idx_exhibition_status ON exhibition(status);

-- 6. RLS (Row Level Security) 정책 추가
ALTER TABLE review_activity_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 로그 조회 가능
CREATE POLICY "Admin can view review activity logs" ON review_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 사용자는 자신의 로그만 조회 가능
CREATE POLICY "Users can view own review activity logs" ON review_activity_logs
  FOR SELECT USING (user_id = auth.uid());

-- 7. 함수: 계정 나이 계산
CREATE OR REPLACE FUNCTION calculate_account_age_days(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(DAY FROM NOW() - (SELECT created_at FROM auth.users WHERE id = user_id));
END;
$$ LANGUAGE plpgsql;

-- 8. 함수: 리뷰 개수 업데이트
CREATE OR REPLACE FUNCTION update_review_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- 리뷰 생성 시
  IF TG_OP = 'INSERT' THEN
    -- 오늘 리뷰 개수 업데이트
    UPDATE profiles 
    SET 
      review_count_today = review_count_today + 1,
      review_count_this_month = review_count_this_month + 1,
      last_review_date = CURRENT_DATE,
      account_age_days = calculate_account_age_days(NEW.user_id)
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  END IF;
  
  -- 리뷰 삭제 시
  IF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET 
      review_count_today = GREATEST(0, review_count_today - 1),
      review_count_this_month = GREATEST(0, review_count_this_month - 1)
    WHERE id = OLD.user_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_review_counts ON exhibition_review;
CREATE TRIGGER trigger_update_review_counts
  AFTER INSERT OR DELETE ON exhibition_review
  FOR EACH ROW EXECUTE FUNCTION update_review_counts();

-- 10. 일일 리뷰 개수 리셋 함수 (매일 자정에 실행)
CREATE OR REPLACE FUNCTION reset_daily_review_counts()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET review_count_today = 0
  WHERE last_review_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 11. 월별 리뷰 개수 리셋 함수 (매월 1일에 실행)
CREATE OR REPLACE FUNCTION reset_monthly_review_counts()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET review_count_this_month = 0
  WHERE DATE_TRUNC('month', last_review_date) < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 12. 어뷰징 감지 함수
CREATE OR REPLACE FUNCTION detect_review_abuse(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  abuse_score INTEGER := 0;
  recent_reviews_count INTEGER;
  same_day_reviews INTEGER;
  same_ip_reviews INTEGER;
  user_ip TEXT;
BEGIN
  -- 최근 24시간 내 리뷰 개수
  SELECT COUNT(*) INTO recent_reviews_count
  FROM exhibition_review 
  WHERE exhibition_review.user_id = detect_review_abuse.user_id
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- 같은 날 리뷰 개수
  SELECT COUNT(*) INTO same_day_reviews
  FROM exhibition_review 
  WHERE exhibition_review.user_id = detect_review_abuse.user_id
    AND DATE(created_at) = CURRENT_DATE;
  
  -- 같은 IP에서 작성한 리뷰 개수 (최근 24시간)
  SELECT ip_address INTO user_ip
  FROM review_activity_logs 
  WHERE review_activity_logs.user_id = detect_review_abuse.user_id
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF user_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO same_ip_reviews
    FROM review_activity_logs 
    WHERE ip_address = user_ip
      AND created_at > NOW() - INTERVAL '24 hours'
      AND action = 'review_created';
  END IF;
  
  -- 어뷰징 점수 계산
  IF recent_reviews_count > 5 THEN
    abuse_score := abuse_score + 20;
  END IF;
  
  IF same_day_reviews > 2 THEN
    abuse_score := abuse_score + 30;
  END IF;
  
  IF same_ip_reviews > 10 THEN
    abuse_score := abuse_score + 50;
  END IF;
  
  -- 어뷰징 점수 업데이트
  UPDATE profiles 
  SET abuse_score = abuse_score
  WHERE id = user_id;
  
  RETURN abuse_score;
END;
$$ LANGUAGE plpgsql;

-- 13. 초기 데이터 업데이트 (기존 사용자들의 계정 나이 계산)
UPDATE profiles 
SET account_age_days = calculate_account_age_days(id)
WHERE account_age_days = 0;

-- 14. 기존 리뷰들의 created_at 업데이트 (created_at이 없는 경우)
UPDATE exhibition_review 
SET created_at = NOW() - INTERVAL '1 day'
WHERE created_at IS NULL;

-- 15. 기존 리뷰들의 updated_at 업데이트
UPDATE exhibition_review 
SET updated_at = created_at
WHERE updated_at IS NULL;

