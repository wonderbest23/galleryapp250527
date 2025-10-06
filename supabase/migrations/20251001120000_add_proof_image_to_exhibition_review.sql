-- exhibition_review 테이블에 proof_image 컬럼 추가
alter table if exists public.exhibition_review 
add column if not exists proof_image text;

-- 코멘트 추가
comment on column public.exhibition_review.proof_image is '리뷰 증빙 사진 (현장사진, 티켓, 영수증 등)';

