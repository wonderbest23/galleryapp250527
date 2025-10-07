-- 에러 모니터링 및 AI 리포트 테이블 생성
-- 관리자 대시보드에서 사용하는 필수 테이블들

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

-- RLS 정책 설정
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능 (서비스 롤)
CREATE POLICY "admin_only_error_logs" ON public.error_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_ai_reports" ON public.ai_reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_admin_notifications" ON public.admin_notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_user_sessions" ON public.user_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_user_feedback" ON public.user_feedback FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_only_traffic_logs" ON public.traffic_logs FOR ALL USING (auth.role() = 'service_role');

-- 사용자는 자신의 피드백만 조회 가능
CREATE POLICY "user_own_feedback" ON public.user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_feedback" ON public.user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);