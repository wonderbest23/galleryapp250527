-- 커뮤니티 도배 방지(게시글 1분 1개, 댓글(대댓글 제외) 1분 3개) 구현

-- 게시글: 동일 유저 1분 1개 제한 ---------------------------------------------------
CREATE OR REPLACE FUNCTION community_post_rate_limit()
RETURNS trigger AS $$
BEGIN
  -- 로그인 사용자만 제한 (user_id NULL 인 경우는 건너뜀)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 직전 1분 이내에 작성한 게시글이 있으면 예외 발생
  IF EXISTS (
    SELECT 1 FROM community_post
    WHERE user_id = NEW.user_id
      AND created_at >= (NOW() AT TIME ZONE 'utc') - INTERVAL '1 minute'
  ) THEN
    RAISE EXCEPTION '게시글은 1분에 한 개만 작성할 수 있습니다.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거가 이미 있으면 교체
DROP TRIGGER IF EXISTS trg_rate_limit_post ON community_post;
CREATE TRIGGER trg_rate_limit_post
BEFORE INSERT ON community_post
FOR EACH ROW EXECUTE FUNCTION community_post_rate_limit();

-- 댓글: 동일 유저 1분에 원댓글 3개 제한 -------------------------------------------
CREATE OR REPLACE FUNCTION community_comment_rate_limit()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- parent_id IS NULL = 원댓글만 대상
  IF NEW.parent_id IS NULL THEN
    IF (SELECT COUNT(*) FROM community_comment
          WHERE user_id = NEW.user_id
            AND parent_id IS NULL
            AND created_at >= (NOW() AT TIME ZONE 'utc') - INTERVAL '1 minute') >= 3 THEN
      RAISE EXCEPTION '댓글은 1분에 3개까지만 작성할 수 있습니다.' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_rate_limit_comment ON community_comment;
CREATE TRIGGER trg_rate_limit_comment
BEFORE INSERT ON community_comment
FOR EACH ROW EXECUTE FUNCTION community_comment_rate_limit(); 