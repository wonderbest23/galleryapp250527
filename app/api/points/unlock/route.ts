import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 48시간이 지난 잠금 포인트 자동 해제
    await supabase.rpc('unlock_points_after_48h');

    // 해제된 포인트 조회
    const { data: unlockedTransactions } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'unlocked')
      .is('unlocked_at', null) // unlocked_at이 null인 경우 (방금 해제된 것)
      .order('created_at', { ascending: false });

    const totalUnlocked = unlockedTransactions?.reduce((sum: number, transaction: any) => sum + transaction.amount, 0) || 0;

    return NextResponse.json({ 
      success: true, 
      data: {
        unlocked_count: unlockedTransactions?.length || 0,
        total_unlocked: totalUnlocked,
        message: totalUnlocked > 0 
          ? `${totalUnlocked}P가 해제되었습니다!`
          : '해제할 포인트가 없습니다.'
      }
    });

  } catch (error) {
    console.error('포인트 잠금 해제 서버 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
