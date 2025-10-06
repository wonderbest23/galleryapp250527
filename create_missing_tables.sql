-- 관리자 대시보드 고급 기능을 위한 누락된 테이블들 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 에러 로그 테이블
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'client' | 'server'
  message text NOT NULL,
  stack text,
  component text,
  severity text NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
  category text, -- 'ui' | 'api' | 'database' | 'auth' | 'payment'
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id text,
  url text,
  user_agent text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. AI 리포트 테이블
CREATE TABLE IF NOT EXISTS public.ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'overall' | 'security' | 'performance' | 'ux' | 'error'
  title text NOT NULL,
  summary text,
  insights jsonb,
  recommendations jsonb,
  score integer, -- 0-100
  generated_by text DEFAULT 'ai',
  created_at timestamptz DEFAULT now()
);

-- 3. 관리자 알림 테이블
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'error' | 'warning' | 'info' | 'success'
  title text NOT NULL,
  message text,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  ip_address text,
  user_agent text,
  location text,
  device_type text, -- 'desktop' | 'mobile' | 'tablet'
  browser text,
  os text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration integer, -- seconds
  page_views integer DEFAULT 0,
  actions integer DEFAULT 0
);

-- 5. 사용자 피드백 테이블
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL, -- 'bug' | 'feature' | 'complaint' | 'praise'
  category text, -- 'ui' | 'performance' | 'content' | 'payment'
  title text NOT NULL,
  description text,
  rating integer, -- 1-5
  status text DEFAULT 'pending', -- 'pending' | 'reviewed' | 'resolved' | 'rejected'
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. 트래픽 로그 테이블
CREATE TABLE IF NOT EXISTS public.traffic_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id text,
  page text NOT NULL,
  action text, -- 'view' | 'click' | 'scroll' | 'search'
  referrer text,
  ip_address text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  location text,
  duration integer, -- seconds spent on page
  created_at timestamptz DEFAULT now()
);

-- 7. 어드민 활동 로그 테이블
CREATE TABLE IF NOT EXISTS public.admin_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text, -- 'user' | 'post' | 'exhibition' | 'artist' | 'journalist'
  target_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 8. 포인트 리뷰 요청 테이블 (이미 있을 수 있음)
CREATE TABLE IF NOT EXISTS public.point_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id text,
  points_requested integer NOT NULL,
  reason text,
  status text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 're-review'
  admin_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. 기자단 신청 테이블 (이미 있을 수 있음)
CREATE TABLE IF NOT EXISTS public.journalist_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text,
  introduction text,
  experience text,
  portfolio_links text[],
  interests text[],
  available_time text,
  visit_frequency text,
  status text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. 전시회 요청 테이블 (이미 있을 수 있음)
CREATE TABLE IF NOT EXISTS public.exhibition_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_date date,
  end_date date,
  location text,
  contact_info text,
  status text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_reports_type ON public.ai_reports(type);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON public.ai_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON public.user_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_page ON public.traffic_logs(page);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_created_at ON public.traffic_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_user_id ON public.traffic_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON public.admin_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activities_created_at ON public.admin_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_point_review_requests_status ON public.point_review_requests(status);
CREATE INDEX IF NOT EXISTS idx_point_review_requests_user_id ON public.point_review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_journalist_applications_status ON public.journalist_applications(status);
CREATE INDEX IF NOT EXISTS idx_journalist_applications_user_id ON public.journalist_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_requests_status ON public.exhibition_requests(status);
CREATE INDEX IF NOT EXISTS idx_exhibition_requests_user_id ON public.exhibition_requests(user_id);

-- RLS 정책 설정
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journalist_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibition_requests ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능 (서비스 롤)
CREATE POLICY "admin_only_error_logs" ON public.error_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_ai_reports" ON public.ai_reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_admin_notifications" ON public.admin_notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_user_sessions" ON public.user_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_user_feedback" ON public.user_feedback FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_traffic_logs" ON public.traffic_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_admin_activities" ON public.admin_activities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_point_review_requests" ON public.point_review_requests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_journalist_applications" ON public.journalist_applications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_exhibition_requests" ON public.exhibition_requests FOR ALL USING (auth.role() = 'service_role');

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "user_own_feedback" ON public.user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_feedback" ON public.user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own_point_review_requests" ON public.point_review_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_point_review_requests" ON public.point_review_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own_journalist_applications" ON public.journalist_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_journalist_applications" ON public.journalist_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own_exhibition_requests" ON public.exhibition_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_exhibition_requests" ON public.exhibition_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO public.error_logs (type, message, severity, category, component) VALUES
('client', 'React component rendering error', 'medium', 'ui', 'Dashboard'),
('server', 'Database connection timeout', 'high', 'database', 'API'),
('client', 'Form validation failed', 'low', 'ui', 'UserForm');

INSERT INTO public.ai_reports (type, title, summary, score) VALUES
('overall', '시스템 전체 분석 리포트', '전반적인 시스템 상태가 양호합니다.', 85),
('security', '보안 분석 리포트', '보안 취약점이 발견되었습니다.', 70),
('performance', '성능 분석 리포트', '성능 최적화가 필요합니다.', 65);

INSERT INTO public.admin_notifications (type, title, message) VALUES
('warning', '높은 서버 부하 감지', '서버 CPU 사용률이 80%를 초과했습니다.'),
('info', '새로운 사용자 가입', '5명의 새로운 사용자가 가입했습니다.'),
('error', '데이터베이스 연결 오류', '데이터베이스 연결에 문제가 발생했습니다.');

-- 완료 메시지
SELECT '모든 테이블이 성공적으로 생성되었습니다!' as result;
