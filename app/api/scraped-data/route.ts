import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 스크랩된 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('scraped_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('스크랩 데이터 조회 오류:', error);
      return NextResponse.json(
        { error: '데이터 조회 중 오류가 발생했습니다: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      total: data?.length || 0
    });

  } catch (error: any) {
    console.error('스크랩 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}

// 스크랩된 데이터 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 데이터 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('scraped_posts')
      .delete()
      .in('id', ids)
      .select();

    if (error) {
      console.error('스크랩 데이터 삭제 오류:', error);
      return NextResponse.json(
        { error: '데이터 삭제 중 오류가 발생했습니다: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: data?.length || 0,
      message: `${data?.length || 0}개의 스크랩 데이터가 삭제되었습니다.`
    });

  } catch (error: any) {
    console.error('스크랩 데이터 삭제 오류:', error);
    return NextResponse.json(
      { error: '데이터 삭제 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
} 