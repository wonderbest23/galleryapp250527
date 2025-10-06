import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

async function generateWithOpenAI(prompts: { title: string; brief: string; category: string }[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const messages = prompts.map((p) => ({
      role: 'user',
      content: `너는 한국 커뮤니티 글을 자연스럽게 쓰는 에디터야. 요구사항:
- 제목엔 콜론/특수문자 쓰지 말고 짧고 담백하게
- 말투는 과하지 않게 일상 대화체
- 카테고리: ${p.category}
- 아래 브리프를 참고해 3~5문장 정도의 본문 작성
브리프: ${p.brief}`,
    }));

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '한국 커뮤니티 톤으로 자연스럽게 쓰는 에디터' },
          ...messages,
        ],
        n: prompts.length,
        temperature: 0.7,
      }),
    });
    const data = await r.json();
    if (!data.choices) return null;
    // choices 배열 길이가 다를 수 있어 안전하게 매핑
    const texts: string[] = Array.isArray(data.choices)
      ? data.choices.map((c: any) => c.message?.content?.trim() || '')
      : [];
    return texts;
  } catch (e) {
    console.log('OpenAI 호출 오류', e);
    return null;
  }
}

function fallbackKTemplates() {
  // 한국 커뮤니티 톤(담백, 자연스러움, 과장 없음). 콜론/특수문자 배제
  return [
    { title: '요즘 NFT 아트 어떻게 보세요', category: 'free', content: '작년보단 조용하지만 꾸준히 보이네요. 디지털 작품을 소장한다는 감각이 아직 낯선 분들도 많고요. 환경 이슈나 투기 얘기도 따라붙다 보니 의견이 갈립니다. 요즘은 어떻게 보시는지 궁금합니다.' },
    { title: '현대미술 전시 보며 좋았던 점', category: 'exhibition', content: '캡션 높이와 조도가 안정적이라 읽고 보기 편했습니다. 동선이 막히지 않게 작은 여유 공간을 둔 것도 좋았고요. 작품보다 전시 호흡이 먼저 떠오르는 경우가 오랜만이었습니다.' },
    { title: '아이패드 드로잉 입문해 보니', category: 'artwork', content: '프로크리에이트로 따라 그리다 보니 되돌리기가 큰 힘이 되네요. 종이에서 포기하던 부분을 다시 시도할 수 있었습니다. 브러시 추천 있으시면 공유 부탁드립니다.' },
    { title: '사진 출력 보존 어떻게 하고 계세요', category: 'artwork', content: '습도만 잘 관리해도 표면 갈라짐이 확 줄었습니다. 포장은 무산성 재질로 간단히 했고요. 전시에서는 반사 줄이는 재질이 체감이 컸습니다. 각자 조합이 궁금합니다.' },
    { title: '레지던시 다녀온 뒤에 남는 것', category: '토론', content: '결과전 노출과 판매, 혹은 함께 일할 사람과의 연결. 시간이 지나 보니 어떤 쪽이 더 도움이 됐나요. 경험 나눠 주시면 좋겠습니다.' },
    { title: '공공미술 유지관리 얘기', category: '토론', content: '설치 이후 관리비를 발주처가 맡아야 하는지, 계약서에 재제작 범위를 명확히 넣어야 하는지 늘 얘기가 나옵니다. 현실적으로 어디까지가 맞다고 보시나요.' },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json().catch(() => ({}));
    const { insert = true, dryRun = false, categories = ['free','exhibition','artwork','토론'], countPerCategory = 2 } = body;

    // 프롬프트 구성
    const briefsByCat: Record<string, string[]> = {
      free: [
        '최근 미술시장 분위기와 컬렉팅 포인트를 가볍게 공유해 주세요',
        '작품 설명과 스토리가 구매에 미치는 영향에 대한 짧은 생각을 적어 주세요',
      ],
      exhibition: [
        '최근 전시를 보고 좋았던 전시 디테일을 2~3가지로 정리해 주세요',
        '동선과 조도, 캡션 가독성 측면에서 느낀 점을 담백하게 적어 주세요',
      ],
      artwork: [
        '드로잉 혹은 페인팅 실무 팁을 경험 위주로 간단히 적어 주세요',
        '사진 출력 보존 팁을 일상적인 말투로 정리해 주세요',
      ],
      '토론': [
        '레지던시의 실질적 가치에 대해 의견을 묻는 글을 작성해 주세요',
        '공공미술 유지관리 비용 책임에 대해 질문형으로 마무리해 주세요',
      ],
    };

    const prompts: { title: string; brief: string; category: string }[] = [];
    categories.forEach((cat: string) => {
      const briefs = briefsByCat[cat] || briefsByCat['free'];
      for (let i = 0; i < countPerCategory; i++) {
        const brief = briefs[i % briefs.length];
        const titleMap: Record<string, string[]> = {
          free: ['요즘 미술시장 어떻게 보세요', '작품 설명이 구매에 주는 영향'],
          exhibition: ['최근 본 전시에서 좋았던 점', '전시 동선과 조도 얘기'],
          artwork: ['드로잉 입문하면서 느낀 점', '사진 출력 보존 팁 공유'],
          '토론': ['레지던시 다녀오고 남는 것', '공공미술 유지관리 어디까지가 맞을까요'],
        };
        const titles = titleMap[cat] || titleMap.free;
        prompts.push({ title: titles[i % titles.length], brief, category: cat });
      }
    });

    // 외부 AI 시도
    let aiContents = await generateWithOpenAI(prompts);

    // Fallback 한국형 템플릿
    const fallback = fallbackKTemplates();

    const rows = prompts.map((p, idx) => {
      const content = aiContents?.[idx] || fallback[idx % fallback.length].content;
      const title = p.title.replace(/[\:\[\]\(\)\-–—•·\|]/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        title,
        content,
        category: p.category,
      } as any;
    });

    if (dryRun) return NextResponse.json({ ok: true, rows });

    if (insert) {
      // 기존 글 제거 후 삽입
      await supabase.from('community_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('community_likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('community_post').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('community_post').insert(rows);
      if (error) {
        console.log('삽입 오류', error);
        return NextResponse.json({ ok: false, error: '삽입 실패' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, inserted: insert ? rows.length : 0 });
  } catch (e: any) {
    console.log('ai-seed 오류', e?.message || e);
    return NextResponse.json({ ok: false, error: '서버 오류' }, { status: 500 });
  }
}
