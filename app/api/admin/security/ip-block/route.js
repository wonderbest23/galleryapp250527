import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin' && profile?.role !== 'master') {
      return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, ip, reason, duration } = body || {};
    
    console.log('IP block request:', { action, ip, reason, duration });

    if (action === 'block') {
      if (!ip || !reason) {
        return NextResponse.json({ 
          success: false, 
          message: 'IP 주소와 차단 사유를 입력해주세요.' 
        }, { status: 400 });
      }

      // 차단 만료 시간 계산 (duration이 null이면 영구 차단)
      let expiresAt = null;
      if (duration) {
        expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
      }

      // IP 차단 추가
      const { data, error } = await supabase
        .from('blocked_ips')
        .insert({
          ip_address: ip,
          reason: reason,
          blocked_by: user.id,
          expires_at: expiresAt,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        // 중복 IP인 경우 업데이트
        if (error.code === '23505') {
          const { error: updateError } = await supabase
            .from('blocked_ips')
            .update({
              reason: reason,
              blocked_by: user.id,
              blocked_at: new Date().toISOString(),
              expires_at: expiresAt,
              is_active: true,
              unblocked_at: null,
              unblocked_by: null,
              updated_at: new Date().toISOString()
            })
            .eq('ip_address', ip);

          if (updateError) {
            console.error('IP 차단 업데이트 오류:', updateError);
            return NextResponse.json({ 
              success: false, 
              message: 'IP 차단 업데이트에 실패했습니다.' 
            }, { status: 500 });
          }

          return NextResponse.json({ 
            success: true, 
            message: 'IP가 재차단되었습니다.' 
          });
        }

        console.error('IP 차단 오류:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'IP 차단에 실패했습니다.' 
        }, { status: 500 });
      }

      console.log('IP 차단 성공:', data);
      return NextResponse.json({ 
        success: true, 
        message: 'IP가 차단되었습니다.',
        data: data
      });

    } else if (action === 'unblock') {
      if (!ip) {
        return NextResponse.json({ 
          success: false, 
          message: 'IP 주소를 입력해주세요.' 
        }, { status: 400 });
      }

      // IP 차단 해제
      const { error } = await supabase
        .from('blocked_ips')
        .update({
          is_active: false,
          unblocked_at: new Date().toISOString(),
          unblocked_by: user.id,
          unblock_reason: reason || '관리자가 차단 해제함',
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ip);

      if (error) {
        console.error('IP 차단 해제 오류:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'IP 차단 해제에 실패했습니다.' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'IP 차단이 해제되었습니다.' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: '잘못된 요청입니다.' 
    }, { status: 400 });

  } catch (error) {
    console.error('IP 차단 처리 중 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}


