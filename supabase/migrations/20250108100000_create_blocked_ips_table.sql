-- IP 차단 테이블 생성
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  reason text NOT NULL,
  blocked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  blocked_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- NULL이면 영구 차단
  is_active boolean DEFAULT true,
  unblocked_at timestamptz,
  unblocked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  unblock_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_is_active ON public.blocked_ips(is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires_at ON public.blocked_ips(expires_at);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_created_at ON public.blocked_ips(created_at);

-- RLS 정책 설정
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY "admin_only_blocked_ips" ON public.blocked_ips 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'master')
    )
  );

-- 만료된 IP 자동 비활성화 함수
CREATE OR REPLACE FUNCTION public.deactivate_expired_ips()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.blocked_ips
  SET is_active = false,
      updated_at = now()
  WHERE expires_at IS NOT NULL
    AND expires_at < now()
    AND is_active = true;
END;
$$;

-- IP 차단 확인 함수
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blocked boolean;
BEGIN
  -- 만료된 IP 자동 비활성화
  PERFORM public.deactivate_expired_ips();
  
  -- IP가 차단되어 있는지 확인
  SELECT EXISTS(
    SELECT 1 
    FROM public.blocked_ips
    WHERE ip_address = p_ip_address
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_blocked;
  
  RETURN v_blocked;
END;
$$;

-- 함수 권한 부여
GRANT EXECUTE ON FUNCTION public.deactivate_expired_ips() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_ip_blocked(text) TO anon, authenticated;

