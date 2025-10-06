-- 기자단 시스템을 위한 테이블 생성

-- 1. 체험단 전시 목록 테이블
CREATE TABLE IF NOT EXISTS journalist_experience_exhibitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT,
    exhibition_info TEXT, -- 전시회 상세 정보 (관리자가 수기로 입력)
    ticket_info TEXT, -- 티켓 정보 (관리자가 수기로 입력)
    location VARCHAR(200),
    start_date DATE,
    end_date DATE,
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 기자단 체험 신청 테이블
CREATE TABLE IF NOT EXISTS journalist_experience_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exhibition_id UUID REFERENCES journalist_experience_exhibitions(id) ON DELETE CASCADE,
    application_type VARCHAR(50) NOT NULL CHECK (application_type IN ('exhibition_link', 'exhibition_info_price')),
    exhibition_link TEXT, -- 전시회 링크
    exhibition_info TEXT, -- 전시회 정보
    price_info TEXT, -- 가격 정보
    additional_notes TEXT, -- 추가 메모
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_comment TEXT, -- 관리자 코멘트
    admin_response TEXT, -- 관리자 응답 (승인/거절 시)
    admin_response_image TEXT, -- 관리자 응답 이미지
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기자단 알림 테이블
CREATE TABLE IF NOT EXISTS journalist_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('application_approved', 'application_rejected', 'experience_available', 'experience_reminder')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    application_id UUID REFERENCES journalist_experience_applications(id) ON DELETE CASCADE,
    exhibition_id UUID REFERENCES journalist_experience_exhibitions(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_journalist_experience_exhibitions_status ON journalist_experience_exhibitions(status);
CREATE INDEX IF NOT EXISTS idx_journalist_experience_exhibitions_created_at ON journalist_experience_exhibitions(created_at);
CREATE INDEX IF NOT EXISTS idx_journalist_experience_applications_user_id ON journalist_experience_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_journalist_experience_applications_status ON journalist_experience_applications(status);
CREATE INDEX IF NOT EXISTS idx_journalist_experience_applications_created_at ON journalist_experience_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_journalist_notifications_user_id ON journalist_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_journalist_notifications_is_read ON journalist_notifications(is_read);

-- 5. RLS 정책 설정
ALTER TABLE journalist_experience_exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_experience_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_notifications ENABLE ROW LEVEL SECURITY;

-- 체험단 전시 목록 정책
CREATE POLICY "Everyone can view active experience exhibitions" ON journalist_experience_exhibitions
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage all experience exhibitions" ON journalist_experience_exhibitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 기자단 체험 신청 정책
CREATE POLICY "Users can view their own applications" ON journalist_experience_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications" ON journalist_experience_applications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'journalist'
        )
    );

CREATE POLICY "Admins can manage all applications" ON journalist_experience_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 기자단 알림 정책
CREATE POLICY "Users can view their own notifications" ON journalist_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON journalist_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 6. 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_journalist_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journalist_experience_exhibitions_updated_at 
    BEFORE UPDATE ON journalist_experience_exhibitions 
    FOR EACH ROW EXECUTE FUNCTION update_journalist_updated_at_column();

CREATE TRIGGER update_journalist_experience_applications_updated_at 
    BEFORE UPDATE ON journalist_experience_applications 
    FOR EACH ROW EXECUTE FUNCTION update_journalist_updated_at_column();

-- 7. 기자단 체험 신청 처리 함수
CREATE OR REPLACE FUNCTION process_journalist_application(
    p_application_id UUID,
    p_admin_id UUID,
    p_status VARCHAR(20),
    p_admin_response TEXT DEFAULT NULL,
    p_admin_response_image TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    application_record RECORD;
BEGIN
    -- 신청 정보 조회
    SELECT * INTO application_record FROM journalist_experience_applications WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 신청 상태 업데이트
    UPDATE journalist_experience_applications 
    SET 
        status = p_status,
        admin_response = p_admin_response,
        admin_response_image = p_admin_response_image,
        processed_by = p_admin_id,
        processed_at = NOW()
    WHERE id = p_application_id;
    
    -- 알림 생성
    IF p_status = 'approved' THEN
        INSERT INTO journalist_notifications (user_id, type, title, message, application_id)
        VALUES (application_record.user_id, 'application_approved', '체험 신청 승인', 
                '기자단 체험 신청이 승인되었습니다.', p_application_id);
                
    ELSIF p_status = 'rejected' THEN
        INSERT INTO journalist_notifications (user_id, type, title, message, application_id)
        VALUES (application_record.user_id, 'application_rejected', '체험 신청 거절', 
                '기자단 체험 신청이 거절되었습니다.', p_application_id);
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. 체험단 전시 참가자 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_exhibition_participants(p_exhibition_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE journalist_experience_exhibitions 
    SET current_participants = (
        SELECT COUNT(*) 
        FROM journalist_experience_applications 
        WHERE exhibition_id = p_exhibition_id 
        AND status = 'approved'
    )
    WHERE id = p_exhibition_id;
END;
$$ LANGUAGE plpgsql;

