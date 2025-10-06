-- 알림 읽음 처리 문제 해결을 위한 SQL
-- 기존 데이터를 보존하면서 필요한 컬럼만 추가

-- 1. community_likes 테이블에 is_read 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_likes' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE community_likes ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_read column to community_likes table';
    ELSE
        RAISE NOTICE 'is_read column already exists in community_likes table';
    END IF;
END $$;

-- 2. community_comments 테이블에 is_read 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_comments' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE community_comments ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_read column to community_comments table';
    ELSE
        RAISE NOTICE 'is_read column already exists in community_comments table';
    END IF;
END $$;

-- 3. reward_purchases 테이블에 is_read 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reward_purchases' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE reward_purchases ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_read column to reward_purchases table';
    ELSE
        RAISE NOTICE 'is_read column already exists in reward_purchases table';
    END IF;
END $$;

-- 4. user_notifications 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. user_notifications 테이블에 is_read 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notifications') AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_notifications' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE user_notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_read column to user_notifications table';
    ELSE
        RAISE NOTICE 'is_read column already exists in user_notifications table';
    END IF;
END $$;

-- 6. 성능 향상을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications (type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_related_id ON user_notifications (related_id);

-- 7. updated_at 자동 업데이트 함수 및 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_user_notifications_updated_at ON user_notifications;
CREATE TRIGGER set_user_notifications_updated_at
    BEFORE UPDATE ON user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. 실행 결과 확인
SELECT 
    'community_likes' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_likes' AND column_name = 'is_read'
    ) THEN 'is_read column exists' ELSE 'is_read column missing' END as status
UNION ALL
SELECT 
    'community_comments' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_comments' AND column_name = 'is_read'
    ) THEN 'is_read column exists' ELSE 'is_read column missing' END as status
UNION ALL
SELECT 
    'reward_purchases' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reward_purchases' AND column_name = 'is_read'
    ) THEN 'is_read column exists' ELSE 'is_read column missing' END as status
UNION ALL
SELECT 
    'user_notifications' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_notifications' AND column_name = 'is_read'
    ) THEN 'is_read column exists' ELSE 'is_read column missing' END as status;
