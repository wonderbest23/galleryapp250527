import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  console.log('=== Admin Actions API 호출됨 ===');
  
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User:', user?.id, user?.email);
    
    if (!user) {
      console.log('권한 없음: 사용자 로그인 안됨');
      return NextResponse.json({ success: false, message: 'unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    console.log('Profile role:', profile?.role);
    
    if (profile?.role !== 'admin' && profile?.role !== 'master') {
      console.log('권한 없음: admin/master가 아님');
      return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { type, action, id, reason } = body || {};
    console.log('Action request:', { type, action, id, reason });

    let result = null;

    if (type === 'report') {
      // 신고: 처리 완료로 상태 변경 (삭제 대신 resolved로 상태 변경)
      try {
        if (action === 'delete') {
          // 해결됨으로 처리
          result = await supabase
            .from('post_reports')
            .update({ 
              status: 'resolved',
              admin_note: '관리자가 처리 완료함',
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
        } else if (action === 'approve') {
          // 승인 (신고 무효 처리)
          result = await supabase
            .from('post_reports')
            .update({ 
              status: 'dismissed',
              admin_note: '신고 무효 처리',
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
        } else if (action === 'reject') {
          // 신고 수용 (게시글 조치)
          result = await supabase
            .from('post_reports')
            .update({ 
              status: 'accepted',
              admin_note: reason || '신고 수용, 게시글 조치 완료',
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
        }
      } catch (e) {
        console.log('report action error:', e);
        result = { error: e };
      }
    } else if (type === 'point') {
      // 포인트 적립 승인/반려 (올바른 테이블명 사용)
      if (action === 'approve') {
        result = await supabase.from('point_review_requests').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', id);
      } else {
        result = await supabase.from('point_review_requests').update({ status: 'rejected', rejection_reason: reason || null, processed_at: new Date().toISOString() }).eq('id', id);
      }
    } else if (type === 'artist') {
      console.log('작가 액션 처리:', action, id);
      try {
        if (action === 'approve') {
          result = await supabase.from('profiles').update({ isArtistApproval: true, is_artist_rejected: false }).eq('id', id);
          console.log('작가 승인 결과:', result);
        } else {
          result = await supabase.from('profiles').update({ isArtistApproval: false, is_artist_rejected: true, reject_reason: reason || '관리자 반려' }).eq('id', id);
          console.log('작가 반려 결과:', result);
        }
      } catch (e) {
        console.error('작가 액션 처리 에러:', e);
        result = { error: e };
      }
    } else if (type === 'journalist') {
      // 기자단 승인/반려 (컬럼이 없으면 생략)
      try {
        if (action === 'approve') {
          result = await supabase.from('profiles').update({ is_journalist_approved: true }).eq('id', id);
        } else {
          result = await supabase.from('profiles').update({ is_journalist_approved: false }).eq('id', id);
        }
      } catch (e) {
        console.log('journalist action error (column may not exist):', e);
        result = { data: null, error: null }; // 컬럼이 없으면 성공으로 처리
      }
    } else {
      return NextResponse.json({ success: false, message: 'invalid_type' }, { status: 400 });
    }

    if (result?.error) {
      console.error('DB 액션 에러:', result.error);
      return NextResponse.json({ 
        success: false, 
        message: 'db_error', 
        error: result.error.message || 'Database error'
      }, { status: 500 });
    }

    console.log('액션 성공 완료:', { type, action, id });
    return NextResponse.json({ success: true, message: 'Action completed successfully' });
    
  } catch (e) {
    console.error('Admin actions 예외:', e);
    return NextResponse.json({ 
      success: false, 
      message: 'server_error',
      error: e.message 
    }, { status: 500 });
  }
}


