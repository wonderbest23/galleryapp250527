-- 숏폼 카테고리로 작성된 게시글들을 삭제하는 SQL 스크립트

-- 먼저 삭제할 게시글들을 확인
SELECT id, title, category, created_at 
FROM community_post 
WHERE category = 'short_video';

-- 숏폼 카테고리 게시글들 삭제
DELETE FROM community_post 
WHERE category = 'short_video';

-- 삭제 완료 후 확인
SELECT COUNT(*) as remaining_shortform_posts 
FROM community_post 
WHERE category = 'short_video';
