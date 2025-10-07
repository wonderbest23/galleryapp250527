-- 수익 분석 시스템을 위한 SQL 스크립트
-- Supabase SQL Editor에서 직접 실행하세요

-- 1. 수익 리포트 테이블 생성
CREATE TABLE IF NOT EXISTS revenue_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content JSONB,
    predictions JSONB,
    ad_plan JSONB,
    customer_analysis JSONB,
    date_range INTEGER DEFAULT 6,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 포인트 거래 내역 테이블 생성 (포인트 손실 분석용)
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('earned', 'spent', 'expired', 'refunded')),
    source VARCHAR(100), -- 'review', 'purchase', 'reward', 'admin'
    description TEXT,
    related_id UUID, -- 관련된 리뷰, 구매 등의 ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 전시회 티켓 테이블 생성 (티켓 수익 분석용)
CREATE TABLE IF NOT EXISTS exhibition_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    exhibition_id UUID,
    price INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 리워드 구매 내역 테이블 생성 (리워드 비용 분석용)
CREATE TABLE IF NOT EXISTS reward_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    reward_item_id UUID,
    item_price INTEGER NOT NULL,
    points_used INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 광고 수익 테이블 생성
CREATE TABLE IF NOT EXISTS ad_revenues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    advertiser_name VARCHAR(255) NOT NULL,
    ad_location VARCHAR(100) NOT NULL,
    ad_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 작품 등록비 테이블 생성
CREATE TABLE IF NOT EXISTS artwork_registration_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID,
    artwork_id UUID,
    fee_amount INTEGER NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_revenue_reports_generated_at ON revenue_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_revenue_reports_type ON revenue_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_revenue_reports_status ON revenue_reports(status);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_exhibition_tickets_user_id ON exhibition_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_tickets_exhibition_id ON exhibition_tickets(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_tickets_status ON exhibition_tickets(status);
CREATE INDEX IF NOT EXISTS idx_exhibition_tickets_purchase_date ON exhibition_tickets(purchase_date);

CREATE INDEX IF NOT EXISTS idx_reward_purchases_user_id ON reward_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_purchases_created_at ON reward_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_reward_purchases_status ON reward_purchases(status);

CREATE INDEX IF NOT EXISTS idx_ad_revenues_advertiser ON ad_revenues(advertiser_name);
CREATE INDEX IF NOT EXISTS idx_ad_revenues_location ON ad_revenues(ad_location);
CREATE INDEX IF NOT EXISTS idx_ad_revenues_start_date ON ad_revenues(start_date);
CREATE INDEX IF NOT EXISTS idx_ad_revenues_status ON ad_revenues(status);

CREATE INDEX IF NOT EXISTS idx_artwork_registration_fees_artist_id ON artwork_registration_fees(artist_id);
CREATE INDEX IF NOT EXISTS idx_artwork_registration_fees_payment_status ON artwork_registration_fees(payment_status);
CREATE INDEX IF NOT EXISTS idx_artwork_registration_fees_created_at ON artwork_registration_fees(created_at);

-- 8. RLS (Row Level Security) 정책 설정
ALTER TABLE revenue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibition_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_registration_fees ENABLE ROW LEVEL SECURITY;

-- 9. 관리자만 접근 가능한 정책
CREATE POLICY "Admin can view all revenue reports" ON revenue_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all point transactions" ON point_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all exhibition tickets" ON exhibition_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all reward purchases" ON reward_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all ad revenues" ON ad_revenues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all artwork registration fees" ON artwork_registration_fees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 10. 사용자는 자신의 데이터만 볼 수 있음
CREATE POLICY "Users can view own point transactions" ON point_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own exhibition tickets" ON exhibition_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reward purchases" ON reward_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own artwork registration fees" ON artwork_registration_fees
    FOR SELECT USING (auth.uid() = artist_id);

-- 11. 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. 트리거 생성
CREATE TRIGGER update_revenue_reports_updated_at BEFORE UPDATE ON revenue_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. 테스트 데이터 삽입 (선택사항)
INSERT INTO point_transactions (user_id, amount, type, source, description) VALUES
(gen_random_uuid(), 500, 'earned', 'review', '리뷰 작성으로 포인트 획득'),
(gen_random_uuid(), 1000, 'spent', 'reward', '리워드샵 상품 구매'),
(gen_random_uuid(), 300, 'earned', 'purchase', '작품 구매로 포인트 획득');

INSERT INTO exhibition_tickets (user_id, exhibition_id, price, status) VALUES
(gen_random_uuid(), gen_random_uuid(), 15000, 'completed'),
(gen_random_uuid(), gen_random_uuid(), 20000, 'completed'),
(gen_random_uuid(), gen_random_uuid(), 12000, 'pending');

INSERT INTO reward_purchases (user_id, reward_item_id, item_price, points_used, status) VALUES
(gen_random_uuid(), gen_random_uuid(), 50000, 1000, 'completed'),
(gen_random_uuid(), gen_random_uuid(), 30000, 600, 'completed'),
(gen_random_uuid(), gen_random_uuid(), 75000, 1500, 'pending');

INSERT INTO ad_revenues (advertiser_name, ad_location, ad_type, amount, start_date, end_date, status) VALUES
('갤러리A', '메인 배너', 'banner', 500000, '2024-10-01', '2024-10-31', 'active'),
('미술관B', '전시회 상세', 'sidebar', 300000, '2024-10-01', '2024-10-31', 'active'),
('아트센터C', '커뮤니티', 'content', 200000, '2024-10-01', '2024-10-31', 'active');

INSERT INTO artwork_registration_fees (artist_id, artwork_id, fee_amount, payment_status, payment_date) VALUES
(gen_random_uuid(), gen_random_uuid(), 100000, 'completed', NOW()),
(gen_random_uuid(), gen_random_uuid(), 100000, 'completed', NOW()),
(gen_random_uuid(), gen_random_uuid(), 100000, 'pending', NULL);

-- 완료 메시지
SELECT '수익 분석 시스템 테이블 생성 완료!' as message;
