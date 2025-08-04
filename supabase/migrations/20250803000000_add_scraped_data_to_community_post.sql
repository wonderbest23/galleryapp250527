-- community_post 테이블에 scraped_data 컬럼 추가
ALTER TABLE public.community_post 
ADD COLUMN IF NOT EXISTS scraped_data JSONB;

-- scraped_data 컬럼에 대한 인덱스 생성 (선택사항)
CREATE INDEX IF NOT EXISTS idx_community_post_scraped_data 
ON public.community_post USING GIN (scraped_data);

-- scraped_data가 있는 포스트만 조회하는 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW public.scraped_community_posts AS
SELECT * FROM public.community_post 
WHERE scraped_data IS NOT NULL; 