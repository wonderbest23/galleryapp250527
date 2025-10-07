import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // 전시회 목록 조회
    const { data: exhibitions, error } = await supabase
      .from('exhibition')
      .select(`
        id,
        name,
        location,
        start_date,
        end_date,
        photo,
        gallery_id,
        gallery:gallery_id (
          id,
          name
        )
      `)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('전시회 조회 오류:', error);
      return NextResponse.json({ 
        success: false, 
        error: '전시회 목록을 불러올 수 없습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: exhibitions || []
    });

  } catch (error) {
    console.error('전시회 API 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
