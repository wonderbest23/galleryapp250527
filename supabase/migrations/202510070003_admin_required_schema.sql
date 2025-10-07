-- Admin dashboard 연동을 위한 필수 스키마 보강 스크립트
-- 안전 실행: 존재 여부 확인 후 생성/추가

-- profiles 필수 컬럼
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='points'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN points integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='isArtist'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN "isArtist" boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='isArtistApproval'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN "isArtistApproval" boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='is_journalist_approved'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_journalist_approved boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- exhibition_review 테이블 보강
CREATE TABLE IF NOT EXISTS public.exhibition_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exhibition_id uuid NULL,
  rating integer NOT NULL DEFAULT 0,
  title text NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exhibition_review_user ON public.exhibition_review(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_review_created ON public.exhibition_review(created_at);

-- point_transactions (포인트 적립/거부 이력)
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- earn|spend|rejected 등
  amount integer NOT NULL DEFAULT 0,
  description text NULL,
  reference_id uuid NULL,
  reference_type text NULL,
  status text NOT NULL DEFAULT 'completed',
  admin_comment text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_point_tx_user ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_ref ON public.point_transactions(reference_type, reference_id);

-- point_review_requests (관리자 수동 검토 흐름이 있을 때 사용) – 있으면 사용, 없으면 생성만
CREATE TABLE IF NOT EXISTS public.point_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  rejection_reason text NULL,
  processed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_point_review_requests_user ON public.point_review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_point_review_requests_status ON public.point_review_requests(status);

-- 신고 테이블 (둘 중 하나라도 존재하도록)
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NULL,
  reporter_id uuid NULL,
  reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- user_notifications 테이블 보강 (필요 컬럼 확인)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NULL,
  message text NULL,
  details text NULL,
  is_read boolean NOT NULL DEFAULT false,
  related_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id);

-- 최소 권한 (RLS가 이미 켜져 있다면 정책은 상황에 맞게 별도 파일에서 관리)
-- 여기서는 스키마 존재 보장만 수행


