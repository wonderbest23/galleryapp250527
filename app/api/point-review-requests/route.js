import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // 먼저 기본 데이터만 조회
    const { data: basicData, error: basicError } = await supabase
      .from('point_review_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (basicError) {
      console.error('포인트 검토 요청 기본 조회 오류:', basicError);
      return NextResponse.json(
        { error: '포인트 검토 요청 조회에 실패했습니다.', details: basicError.message },
        { status: 500 }
      );
    }

    // 각 요청에 대해 관련 데이터를 개별적으로 조회
    const enrichedData = await Promise.all(
      (basicData || []).map(async (request) => {
        const enriched = { ...request };

        // 사용자 정보 조회
        if (request.user_id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, points')
            .eq('id', request.user_id)
            .single();
          enriched.user = userData;
        }

        // 리뷰 정보 조회
        if (request.review_id) {
          const { data: reviewData } = await supabase
            .from('exhibition_review')
            .select(`
              id,
              rating,
              description,
              name,
              created_at,
              exhibition_id
            `)
            .eq('id', request.review_id)
            .single();
          
          if (reviewData?.exhibition_id) {
            const { data: exhibitionData } = await supabase
              .from('exhibition')
              .select('id, title, location')
              .eq('id', reviewData.exhibition_id)
              .single();
            enriched.review = { ...reviewData, exhibition: exhibitionData };
          } else {
            enriched.review = reviewData;
          }
        }

        // 관리자 정보 조회
        if (request.admin_id) {
          const { data: adminData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', request.admin_id)
            .single();
          enriched.admin = adminData;
        }

        return enriched;
      })
    );

    return NextResponse.json({ data: enrichedData });
  } catch (error) {
    console.error('포인트 검토 요청 조회 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
