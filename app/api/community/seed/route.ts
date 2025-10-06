import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 요청 파라미터 (옵션)
    const { dryRun = false } = await req.json().catch(() => ({ dryRun: false }));

    // 현재 로그인 사용자 확인 (선택)
    const { data: userResp } = await supabase.auth.getUser();
    const currentUserId = userResp?.user?.id ?? null;

    // 1) 기존 데이터 삭제(댓글/좋아요 → 게시글 순서)
    if (!dryRun) {
      await supabase.from('community_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('community_likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('community_post').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 2) 시드 데이터 (숏폼 제외)
    // 카테고리: free, exhibition, artwork, 토론(discussion)
    // created_at/updated_at은 DB 기본값 사용

    const seeds = [
      // 자유 — 한국 커뮤니티 톤으로 자연스럽게
      {
        title: '요즘 미술시장 4분기 분위기 어떠세요',
        content:
          '페어가 계속 열리면서 초반 가격대 작품이 빨리 빠지네요. 공통적으로 느낀 건 작품 설명이 탄탄할수록 반응이 좋다는 점이에요. 숫자보다 문장에 힘이 실린 느낌입니다. 다들 요즘은 어떤 포인트 보고 선택하시는지 궁금해요.',
        category: 'free',
      },
      {
        title: '복원 최소 개입 이야기 현장에서 느낀 점',
        content:
          '적외선 촬영까지 해도 관람객 입장에선 개입이 눈에 띌 때가 있죠. 기록을 남기고 최대한 조용히 손보는 게 좋았습니다. 같은 작품을 몇 번 다시 보니 오히려 덜 손댄 버전이 더 편안하더라고요. 비슷하게 느끼신 분 계신가요.',
        category: 'free',
      },

      // 전시회 — 디테일 위주, 담백한 서술
      {
        title: '올해 국현 전시 보며 좋았던 점 세 가지',
        content:
          '캡션 높이 정리, 미디어룸 잔광 줄이기, 동선에 잠깐의 역류 허용. 별거 아닌 것 같은데 체류 시간이 눈에 띄게 늘었어요. 전시가 장면의 합이 아니라 호흡이라면 이런 디테일이 꽤 크네요.',
        category: 'exhibition',
      },
      {
        title: '이번 비엔날레에서 본 지속가능 전시 시공',
        content:
          '재사용 가능한 모듈 벽을 많이 썼고 표면은 최대한 중성으로 갔습니다. 설치가 가벼워지니 작품이 더 또렷하게 보였어요. 비용도 줄고 회수도 쉽고요. 국내 현장에서도 점점 늘 것 같습니다.',
        category: 'exhibition',
      },

      // 작품 — 실무 팁 위주, 수치/제품명 대신 경험 공유 톤
      {
        title: '아크릴 위 유화 테스트 메모 공유',
        content:
          '젯소 두 번 올리고 유화 레이어 얹었을 때 크랙이 가장 적었습니다. 붉은 계열 그라운드가 안정적이었고 건조 대기는 최소 2주 이상이 괜찮았어요. 비슷하게 테스트해 보신 분 계시면 의견 부탁드립니다.',
        category: 'artwork',
      },
      {
        title: '잉크젯 프린트 보존 팁 공유',
        content:
          '습도와 온도만 잘 잡아도 광택층 갈라짐이 확 줄었습니다. 포장은 무산성 재질로 간단히 해도 효과가 있었고요. 전시장은 반사 줄이는 자재가 체감이 컸습니다. 여러분은 어떤 조합이 좋았나요.',
        category: 'artwork',
      },

      // 토론 — 질문형 마무리
      {
        title: '레지던시 다녀와서 결국 남는 것',
        content:
          '결과전에서의 노출과 판매, 혹은 함께 작업할 사람과의 연결. 시간이 지나면 뭐가 더 남던가요. 저는 네트워크 쪽 손을 조금 들어주게 되더라고요. 다른 분들 경험이 궁금합니다.',
        category: '토론',
      },
      {
        title: '공공미술 유지관리 비용 이야기',
        content:
          '설치 이후 관리비를 발주처가 맡아야 하는지, 계약서에 작가 재제작 범위를 명확히 넣어야 하는지 현장에서 늘 얘기가 나옵니다. 현실적으로 어디까지가 맞다고 보시나요.',
        category: '토론',
      },
    ];

    // 시드 입력용 사용자
    const seedUserId = currentUserId; // 로그인 사용자가 있으면 그 아이디로, 없으면 null

    const rows = seeds.map((p) => ({
      title: p.title,
      content: p.content,
      category: p.category,
      user_id: seedUserId,
    }));

    if (!dryRun) {
      const { error: insertError } = await supabase.from('community_post').insert(rows);
      if (insertError) {
        console.log('시드 입력 오류:', insertError);
        return NextResponse.json({ ok: false, error: '시드 입력 실패', detail: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, deleted: !dryRun, seeded: !dryRun, count: rows.length });
  } catch (e: any) {
    console.log('시드 API 오류:', e?.message || e);
    return NextResponse.json({ ok: false, error: '서버 오류' }, { status: 500 });
  }
}
