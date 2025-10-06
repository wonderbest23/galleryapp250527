import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isRead = searchParams.get('is_read');

    let query = supabase
      .from('point_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('알림 조회 오류:', error);
      return NextResponse.json({ success: false, error: '알림 조회에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data || []
    });

  } catch (error) {
    console.error('알림 조회 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { notification_id, is_read } = await request.json();

    if (!notification_id) {
      return NextResponse.json({ success: false, error: '알림 ID가 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('point_notifications')
      .update({ is_read })
      .eq('id', notification_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('알림 업데이트 오류:', error);
      return NextResponse.json({ success: false, error: '알림 업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '알림이 업데이트되었습니다.' 
    });

  } catch (error) {
    console.error('알림 업데이트 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

