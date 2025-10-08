-- community_polls 테이블 생성: 커뮤니티 토론 게시글의 투표 기능을 위한 테이블

CREATE TABLE IF NOT EXISTS public.community_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_post(id) ON DELETE CASCADE,
  question text NOT NULL,
  options text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- community_poll_votes 테이블 생성: 투표 결과를 저장하는 테이블
CREATE TABLE IF NOT EXISTS public.community_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id) -- 한 사용자는 하나의 투표만 가능
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_community_polls_post_id ON public.community_polls(post_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_votes_poll_id ON public.community_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_votes_user_id ON public.community_poll_votes(user_id);

-- RLS 정책 설정
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;

-- community_polls 정책
CREATE POLICY "polls_select" ON public.community_polls FOR SELECT USING (true);
CREATE POLICY "polls_insert" ON public.community_polls FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "polls_update" ON public.community_polls FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "polls_delete" ON public.community_polls FOR DELETE USING (auth.uid() IS NOT NULL);

-- community_poll_votes 정책
CREATE POLICY "votes_select" ON public.community_poll_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON public.community_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_update" ON public.community_poll_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "votes_delete" ON public.community_poll_votes FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 설정
CREATE TRIGGER update_community_polls_updated_at 
  BEFORE UPDATE ON public.community_polls 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
