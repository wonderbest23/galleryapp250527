-- 안전하게 is_read 컬럼 추가 (기존 데이터 보존)
-- community_likes 테이블에 is_read 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_likes' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE community_likes ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- community_comments 테이블에 is_read 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_comments' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE community_comments ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- reward_purchases 테이블에 is_read 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reward_purchases' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE reward_purchases ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- user_notifications 테이블이 없으면 생성
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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_related_id ON user_notifications(related_id);
