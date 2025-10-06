-- exhibition_review 테이블에 title 컬럼 추가
alter table if exists public.exhibition_review add column if not exists title text;
