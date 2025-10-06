-- Add is_read column to community_likes table
ALTER TABLE community_likes 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add is_read column to community_comments table  
ALTER TABLE community_comments 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add is_read column to reward_purchases table
ALTER TABLE reward_purchases 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Ensure user_notifications table exists with proper structure
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_related_id ON user_notifications(related_id);
