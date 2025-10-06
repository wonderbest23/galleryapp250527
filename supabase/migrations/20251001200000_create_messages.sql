-- 메시지 시스템을 위한 테이블 생성
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_product_id ON messages(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- RLS 정책 설정
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 메시지 읽기 권한 (송신자와 수신자만)
CREATE POLICY "Users can read their own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- 메시지 생성 권한 (로그인한 사용자만)
CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 메시지 업데이트 권한 (수신자만 읽음 상태 변경 가능)
CREATE POLICY "Receivers can update read status" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 메시지 삭제 권한 (송신자만)
CREATE POLICY "Senders can delete their messages" ON messages
  FOR DELETE USING (auth.uid() = sender_id);
