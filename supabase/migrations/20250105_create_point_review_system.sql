-- 포인트 검토 시스템을 위한 테이블 생성

-- 1. 포인트 검토 요청 테이블
CREATE TABLE IF NOT EXISTS point_review_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    review_id UUID REFERENCES exhibition_review(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 500,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 're_review_requested')),
    admin_id UUID REFERENCES auth.users(id),
    admin_comment TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 포인트 검토 알림 테이블
CREATE TABLE IF NOT EXISTS point_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('point_approved', 'point_rejected', 're_review_requested')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    point_review_request_id UUID REFERENCES point_review_requests(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 포인트 거래 내역 테이블 (기존 테이블이 없다면)
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('earn', 'spend', 'refund')),
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- 관련 ID (리뷰 ID, 주문 ID 등)
    reference_type VARCHAR(50), -- 'review', 'purchase', 'refund' 등
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_point_review_requests_user_id ON point_review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_point_review_requests_status ON point_review_requests(status);
CREATE INDEX IF NOT EXISTS idx_point_review_requests_created_at ON point_review_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_point_notifications_user_id ON point_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_point_notifications_is_read ON point_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);

-- 5. RLS 정책 설정
ALTER TABLE point_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- 포인트 검토 요청 정책
CREATE POLICY "Users can view their own point review requests" ON point_review_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all point review requests" ON point_review_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- 포인트 알림 정책
CREATE POLICY "Users can view their own notifications" ON point_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON point_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- 포인트 거래 정책
CREATE POLICY "Users can view their own transactions" ON point_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON point_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- 6. 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_point_review_requests_updated_at 
    BEFORE UPDATE ON point_review_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 포인트 검토 요청 생성 함수
CREATE OR REPLACE FUNCTION create_point_review_request(
    p_user_id UUID,
    p_review_id UUID,
    p_points INTEGER DEFAULT 500
)
RETURNS UUID AS $$
DECLARE
    request_id UUID;
BEGIN
    INSERT INTO point_review_requests (user_id, review_id, points)
    VALUES (p_user_id, p_review_id, p_points)
    RETURNING id INTO request_id;
    
    -- 알림 생성
    INSERT INTO point_notifications (user_id, type, title, message, point_review_request_id)
    VALUES (p_user_id, 'point_approved', '포인트 검토 요청', '리뷰 작성으로 인한 포인트 적립이 검토 중입니다.', request_id);
    
    RETURN request_id;
END;
$$ LANGUAGE plpgsql;

-- 8. 포인트 승인/거절 처리 함수
CREATE OR REPLACE FUNCTION process_point_review(
    p_request_id UUID,
    p_admin_id UUID,
    p_status VARCHAR(20),
    p_admin_comment TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- 요청 정보 조회
    SELECT * INTO request_record FROM point_review_requests WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 요청 상태 업데이트
    UPDATE point_review_requests 
    SET 
        status = p_status,
        admin_id = p_admin_id,
        admin_comment = p_admin_comment,
        rejection_reason = p_rejection_reason,
        processed_at = NOW()
    WHERE id = p_request_id;
    
    -- 알림 생성
    IF p_status = 'approved' THEN
        -- 포인트 거래 내역 생성
        INSERT INTO point_transactions (user_id, type, amount, description, reference_id, reference_type)
        VALUES (request_record.user_id, 'earn', request_record.points, '리뷰 작성 포인트 적립', request_record.review_id, 'review');
        
        -- 프로필 포인트 업데이트
        UPDATE profiles 
        SET points = points + request_record.points 
        WHERE id = request_record.user_id;
        
        -- 승인 알림
        INSERT INTO point_notifications (user_id, type, title, message, point_review_request_id)
        VALUES (request_record.user_id, 'point_approved', '포인트 적립 완료', 
                CONCAT(request_record.points, 'P가 적립되었습니다.'), p_request_id);
                
    ELSIF p_status = 'rejected' THEN
        -- 거절 알림
        INSERT INTO point_notifications (user_id, type, title, message, point_review_request_id)
        VALUES (request_record.user_id, 'point_rejected', '포인트 적립 거절', 
                CONCAT('포인트 적립이 거절되었습니다. 사유: ', COALESCE(p_rejection_reason, '사유 없음')), p_request_id);
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. 재검토 요청 함수
CREATE OR REPLACE FUNCTION request_point_re_review(
    p_request_id UUID,
    p_user_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- 요청 정보 조회 및 권한 확인
    SELECT * INTO request_record FROM point_review_requests 
    WHERE id = p_request_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 재검토 요청으로 상태 변경
    UPDATE point_review_requests 
    SET 
        status = 're_review_requested',
        rejection_reason = p_reason,
        processed_at = NULL,
        admin_id = NULL,
        admin_comment = NULL
    WHERE id = p_request_id;
    
    -- 재검토 요청 알림
    INSERT INTO point_notifications (user_id, type, title, message, point_review_request_id)
    VALUES (p_user_id, 're_review_requested', '재검토 요청', 
            CONCAT('포인트 적립에 대한 재검토를 요청했습니다. 사유: ', p_reason), p_request_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

