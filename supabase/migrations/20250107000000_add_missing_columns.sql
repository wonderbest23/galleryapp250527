-- traffic_logs 테이블에 is_suspicious 컬럼 추가
ALTER TABLE public.traffic_logs 
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE;

-- profiles 테이블에 is_journalist_approved 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_journalist_approved BOOLEAN DEFAULT FALSE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_traffic_logs_suspicious ON public.traffic_logs(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_profiles_journalist_approved ON public.profiles(is_journalist_approved);
