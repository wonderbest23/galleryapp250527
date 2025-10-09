-- 기자단 신청 테이블의 모든 기존 정책 삭제 후 새로 생성

-- 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own applications" ON public.journalist_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.journalist_applications;
DROP POLICY IF EXISTS "Allow all authenticated users to view applications" ON public.journalist_applications;
DROP POLICY IF EXISTS "Allow authenticated users to update applications" ON public.journalist_applications;

-- 새로운 정책 생성

-- 1. 모든 인증된 사용자가 모든 신청을 볼 수 있도록 설정
CREATE POLICY "Allow all authenticated users to view applications"
  ON public.journalist_applications FOR SELECT
  TO authenticated
  USING (true);

-- 2. 사용자는 자신의 신청만 생성할 수 있음
CREATE POLICY "Users can create their own applications"
  ON public.journalist_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. 모든 인증된 사용자가 업데이트 가능하도록 설정 (관리자 페이지에서 승인/반려 처리용)
CREATE POLICY "Allow authenticated users to update applications"
  ON public.journalist_applications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
