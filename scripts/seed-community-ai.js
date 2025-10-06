/*
  Seed community posts with human-like texts per category (excluding review).
  Usage: node scripts/seed-community-ai.js
*/
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const nowIso = () => new Date().toISOString();

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const dataBank = {
  free: {
    titles: [
      '오늘 본 전시, 생각보다 차분했어요',
      '작가와의 대화에서 들은 준비 과정',
      '관람 동선이 좋아 끝까지 편하게 봤습니다',
      '조명과 음악이 적절해서 집중하기 좋았어요',
      '주말 낮에 가볍게 보기 좋은 전시'
    ],
    bodies: [
      '입장부터 마감까지 전체 흐름이 차분했습니다. 인파가 많지 않아 작품 앞에서 충분히 머무를 수 있었고, 안내 스태프도 친절했어요.',
      '작품 수에 비해 설명과 도면이 잘 준비되어 있어 길을 잃지 않았습니다. 특정 구간은 조도가 낮아 자연스럽게 시선이 작품으로 모였습니다.',
      '소재를 다루는 방식이 솔직해서 새로웠습니다. 크게 드러내기보다 차근차근 축적하는 느낌이라 오래 기억에 남을 것 같아요.',
      '관람을 방해하지 않는 선에서 사진 촬영이 허용되어 기록하기 좋았습니다. 작품 앞에서 줄이 덜 생겨 관람 속도도 안정적이었어요.'
    ]
  },
  exhibition: {
    titles: [
      '이번 주 가볍게 둘러보기 좋은 전시 3곳',
      '퇴근길에 들르기 좋은 작은 전시',
      '도심에서 한 시간, 주말 추천 전시'
    ],
    bodies: [
      '규모는 크지 않지만 작품 간 간격이 넉넉해 감상하기 좋습니다. 예약이 필수는 아니고, 현장 구매도 여유가 있었어요.',
      '개관 시간이 길어 퇴근 후 방문하기 편했습니다. 설명 문구가 부담스럽지 않아 동선에 자연스럽게 스며듭니다.'
    ]
  },
  discussion: {
    titles: [
      '디지털 아트의 진위와 거래 신뢰, 어디까지 가능할까',
      '전시 관람료 책정, 어떤 기준이 적절할까요'
    ],
    bodies: [
      '블록체인 인증이 보편화되면 2차 거래에서도 신뢰가 생길까요? 실제 관람 경험을 기반으로 의견을 듣고 싶습니다.',
      '작품 보존과 운영비가 반영되어야 한다는 측면과, 접근성을 위해 가격의 유연성이 필요하다는 의견이 공존합니다. 여러분 생각은 어떤가요?'
    ]
  },
  journalist: {
    titles: [
      '신작 중심으로 본 설치 작업의 작은 변주',
      '작가의 최근 연작, 재료의 물성을 다시 읽다',
      '빛과 표면, 그리고 시간에 대한 작은 기록'
    ],
    bodies: [
      // 900~1100자 분량의 긴 본문을 여러 개 준비하고 무작위 선택
      '입구에서부터 전시는 과장된 안내문보다 조용한 리듬을 먼저 제시한다. 작품과 작품 사이의 간격이 넉넉해 관객의 걸음이 급해질 이유가 없고, 작은 조도의 차이로 시선을 조금씩 붙잡아 둔다. 신작 설치 작업은 재료의 표면을 불필요하게 번들거리게 하지 않고, 빛이 스치며 남기는 얕은 흔적을 그대로 드러낸다. 이번 연작에서 흥미로운 점은 감각을 거칠게 자극하지 않으면서도 특정 순간에 집중을 유도한다는 사실이다. 벽면의 미세한 울림이나 바닥에 깔린 매트의 탄성 같은 요소가 관람자의 몸을 살며시 끌어당긴다. 텍스트는 최소한으로 배치되어 있으며, 설명을 덜어낸 자리에는 관객의 호흡이 들어온다. 작가는 ‘손대지 않은 듯한 손길’을 통해, 물성이 스스로 말하게 두려는 태도를 보여준다. 특히 후반부에 놓인 소형 설치물은 앞서 보인 작업의 변주처럼 기능한다. 반복 구조 안에서 미세한 차이를 감지하게 하는 구성은 전시 전체의 리듬을 정리해 준다. 이번 전시가 남기는 인상은 ‘정리된 담백함’에 가깝다. 시각적 흥분 대신 천천히 머물며 내면의 온도를 고르게 하는 시간. 관객이 곁에 둔 하루의 속도를 잠시 낮추기에 충분하다.',
      '최근 연작은 물성의 표면을 과장하지 않는 선에서 단단하게 구축된다. 캔버스나 공업 소재 위로 얇은 층을 반복해 올리는 과정은, 표면의 우연을 최대한 보존하려는 방향으로 진행된다. 그 때문에 결과물은 매끈한 마감보다는 ‘미세한 숨’을 품은 듯 보인다. 이 호흡은 조명에서 다시 한번 확인된다. 강한 명암 대비를 피하고, 관객의 그림자가 작품 위에 부드럽게 얹히도록 배려했다. 작품 간 간격은 넉넉하고, 동선은 단순하다. 하지만 단순함은 곧바로 빈약함으로 연결되지 않는다. 다층의 얇은 흔적이 켜켜이 쌓여 특정 순간에 의미의 밀도를 형성한다. 후기 작업에서 보이는 작은 오브제들은 전시의 톤을 지나치게 높이지 않으면서도 포인트를 제공한다. 사운드도 과감히 배제했다. 관람 공간이 고요해야 표면의 작은 떨림을 들을 수 있다는 판단일 것이다. 전시는 과장된 서사를 외부에서 덧씌우지 않는다. 대신 관객이 스스로 이야기의 속도를 선택하게 한다. 이 느슨하지만 명료한 구성은 최근 미술 전시의 유행과 일정한 거리를 둔 선택으로 읽힌다.'
    ],
    // 전시 사진으로 사용할 공공 도메인/무료 스톡 이미지 URL들
    images: [
      'https://images.pexels.com/photos/277253/pexels-photo-277253.jpeg',
      'https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg',
      'https://images.pexels.com/photos/247932/pexels-photo-247932.jpeg'
    ]
  },
  short_video: {
    titles: [
      '전시장 스냅',
      '빛에 따라 달라지는 색'
    ],
    bodies: [
      '움직임에 반응하는 설치, 짧게 기록했습니다.',
      '빛의 각도에 따라 달라지는 색의 변주.'
    ],
    videos: [
      'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
      'https://media.w3.org/2010/05/bunny/movie.mp4',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    ]
  }
};

function makeOne(category){
  const bank = dataBank[category];
  const base = {
    category,
    title: pick(bank.titles),
    content: pick(bank.bodies),
    created_at: nowIso()
  };
  if (category === 'short_video') {
    base.video_url = pick(bank.videos);
  }
  if (category === 'journalist') {
    // 긴 본문과 전시 이미지 배열 부여
    base.content = pick(dataBank.journalist.bodies);
    base.images = JSON.stringify([
      pick(dataBank.journalist.images),
      pick(dataBank.journalist.images)
    ]);
  }
  return base;
}

async function run(){
  const plan = [
    { category: 'free', n: 8 },
    { category: 'exhibition', n: 6 },
    { category: 'discussion', n: 5 },
    { category: 'journalist', n: 4 },
    { category: 'short_video', n: 4 }
  ];

  for (const p of plan){
    const rows = Array.from({ length: p.n }).map(()=>makeOne(p.category));
    const { error } = await supabase.from('community_post').insert(rows);
    if (error) console.log('insert error', p.category, error.message);
    else console.log('inserted', p.category, rows.length);
  }

  const { data } = await supabase.from('community_post').select('id,category').order('created_at',{ascending:false}).limit(10);
  console.log('done, last 10:', data?.map(v=>v.category).join(', '));
}

run().catch(e=>{ console.error(e); process.exit(1); });


