const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 창의적이고 고퀄리티인 커뮤니티 글들
const qualityPosts = [
  {
    title: "AI가 그린 그림, 진짜 예술일까? 🤖",
    content: `최근 DALL-E와 Midjourney로 만든 작품들이 미술계를 뒤흔들고 있네요. 

저도 한번 해봤는데, '고흐 스타일로 고양이 그려줘'라고 하니까 정말 고흐 같으면서도 완전 새로운 느낌이 나와서 깜짝 놀랐어요! 

하지만 진짜 작가들이 느끼는 우려도 이해가 돼요. AI가 만든 걸 예술이라고 할 수 있을까? 창작자의 고뇌와 경험은 어디에 있을까요?

여러분은 어떻게 생각하세요? AI 아트의 미래는?`,
    category: "토론",
    author: "김예술",
    likes: 89,
    comments: 23,
    image_url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800"
  },
  {
    title: "NFT 시대, 미술관은 어떻게 변할까? 🖼️",
    content: `루브르에서 모나리자를 보면서 문득 생각이 들었어요. 

지금은 원본을 보러 가야 하는데, 10년 후에는 VR로 어디서든 감상할 수 있겠죠? 그럼 미술관의 의미는 뭘까요?

실제로 몇몇 미술관에서는 이미 NFT 전시를 하고 있고, 메타버스 갤러리도 생기고 있더라구요. 

물리적 공간의 감동 vs 디지털의 편리함... 여러분은 어떤 미래를 원하시나요?`,
    category: "exhibition",
    author: "박디지털",
    likes: 156,
    comments: 34,
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"
  },
  {
    title: "작가가 된 AI, 저작권은 누구 것? ⚖️",
    content: `정말 흥미로운 사건이 있었어요. AI가 그린 그림이 미술대회에서 1등을 받았는데, 작가가 AI라고 밝혀지자 논란이 됐더라구요.

법적으로는 AI는 법인격이 없으니까... 그럼 누구 것일까요? AI를 만든 회사? 명령을 내린 사람? 아니면 AI 자체?

이미 몇몇 나라에서는 AI 창작물의 저작권에 대한 법안을 검토하고 있다고 해요. 

미래의 예술계가 어떻게 될지 정말 궁금하네요. 여러분 생각은?`,
    category: "토론", 
    author: "이법률",
    likes: 67,
    comments: 18,
    image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800"
  },
  {
    title: "메타버스 갤러리 체험기 🥽",
    content: `어제 Horizon Worlds에서 가상 갤러리를 체험해봤는데, 진짜 신기했어요!

실제로는 불가능한 공간 구조로 전시를 할 수 있더라구요. 천장에서 그림이 떨어지고, 바닥이 투명해서 아래층 작품이 보이고... 

물론 아직은 그래픽이 좀 어색하긴 하지만, 앞으로 기술이 발전하면 정말 혁신적일 것 같아요.

실제 미술관과 가상 갤러리, 어느 쪽이 더 좋을까요?`,
    category: "shortform",
    author: "최VR",
    likes: 203,
    comments: 45,
    video_url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
  },
  {
    title: "환경을 생각하는 미술, 가능할까? 🌱",
    content: `최근에 친구가 '지속가능한 예술'에 대해 이야기해줘서 관심이 생겼어요.

일반적으로 예술은 자원을 많이 쓰잖아요. 캔버스, 물감, 조각 재료들... 그리고 전시장의 에너지 소비도 엄청나고요.

그런데 몇몇 작가들은 재활용 재료로 작품을 만들거나, 태양광으로 전시장을 운영하는 실험을 하고 있더라구요.

예술의 본질과 환경 보호, 이 둘을 어떻게 조화시킬 수 있을까요? 여러분의 아이디어가 궁금해요!`,
    category: "free",
    author: "정환경",
    likes: 78,
    comments: 12,
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"
  },
  {
    title: "전시회 큐레이션의 미래 🎨",
    content: `AI 큐레이터가 등장한다면 어떨까요? 

사용자의 취향을 분석해서 개인 맞춤 전시를 기획하고, 작품들 간의 연결고리도 찾아내고... 

물론 인간 큐레이터의 직관과 경험은 대체할 수 없겠지만, 데이터 기반의 객관적 분석은 정말 유용할 것 같아요.

실제로 몇몇 미술관에서는 이미 AI를 활용한 전시 기획을 실험하고 있다고 하네요.

미래의 전시회는 어떻게 변할까요?`,
    category: "exhibition",
    author: "한큐레이터",
    likes: 134,
    comments: 28,
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"
  },
  {
    title: "디지털 아트의 진화 🚀",
    content: `10년 전만 해도 디지털 아트는 '진짜 예술'로 인정받기 어려웠는데, 지금은 완전히 달라졌어요.

NFT 열풍으로 디지털 작품의 가치가 인정받기 시작했고, 이제는 전통 미술관에서도 디지털 전시를 하는 시대가 됐죠.

특히 인터랙티브 아트는 관객이 직접 참여할 수 있어서 정말 흥미로워요. 작품이 관객의 움직임에 반응하고, 소리에도 반응하고...

앞으로 디지털 아트는 어떤 방향으로 발전할까요?`,
    category: "artwork",
    author: "디지털작가",
    likes: 167,
    comments: 31,
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800"
  },
  {
    title: "미술 교육의 혁신 📚",
    content: `온라인 미술 수업이 정말 발전했어요! 

VR로 유명 미술관을 가상 투어하고, AR로 그림 위에 정보를 띄우고, AI가 실시간으로 피드백을 주고...

특히 코로나 이후로 이런 기술들이 급속도로 발전했더라구요. 

하지만 직접 붓을 잡고 물감 냄새를 맡는 경험은 대체할 수 없을 것 같아요.

미래의 미술 교육은 어떻게 될까요?`,
    category: "free",
    author: "교육자김",
    likes: 92,
    comments: 19,
    image_url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800"
  }
];

// 댓글 데이터
const qualityComments = [
  "와 정말 좋은 관점이네요! 저도 생각해본 적이 있는데...",
  "이거 진짜 공감돼요. 저도 비슷한 경험이 있어요.",
  "흥미로운 주제네요! 다른 각도에서 보면...",
  "완전 동감해요! 특히 그 부분이 정말...",
  "새로운 관점이네요. 한번 생각해볼게요!",
  "이런 식으로 생각해볼 수 있군요. 좋은 아이디어에요!",
  "저도 궁금했던 부분이었는데, 도움이 됐어요.",
  "정말 깊이 있는 생각이네요. 공유해주셔서 감사해요!",
  "이런 관점은 처음 들어봐요. 흥미롭네요!",
  "완전 공감합니다. 저도 비슷하게 생각했어요."
];

async function createQualityPosts() {
  try {
    console.log('고퀄리티 커뮤니티 글 생성 시작...');

    // 투표 데이터도 함께 생성
    const pollData = [
      {
        question: "AI가 그린 그림, 진짜 예술일까요?",
        options: ["예술이다", "예술이 아니다", "경계가 모호하다", "시간이 지나봐야 안다"]
      },
      {
        question: "미래의 미술관은 어떤 모습일까요?",
        options: ["물리적 공간 중심", "디지털/VR 중심", "하이브리드", "완전히 새로운 형태"]
      }
    ];

    for (let i = 0; i < qualityPosts.length; i++) {
      const post = qualityPosts[i];
      
      // 게시글 생성
      const { data: postData, error: postError } = await supabase
        .from('community_post')
        .insert({
          title: post.title,
          content: post.content,
          category: post.category,
          author: post.author,
          likes: post.likes,
          comments: post.comments,
          image_url: post.image_url,
          video_url: post.video_url,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // 최근 7일 내
        })
        .select()
        .single();

      if (postError) {
        console.error('게시글 생성 오류:', postError);
        continue;
      }

      // 투표 데이터 추가 (토론 카테고리인 경우)
      if (post.category === '토론' && pollData[Math.floor(Math.random() * pollData.length)]) {
        const poll = pollData[Math.floor(Math.random() * pollData.length)];
        await supabase
          .from('community_polls')
          .insert({
            post_id: postData.id,
            question: poll.question,
            options: poll.options
          });
      }

      // 댓글 생성 (2-5개)
      const commentCount = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < commentCount; j++) {
        await supabase
          .from('community_comments')
          .insert({
            post_id: postData.id,
            user_id: '00000000-0000-0000-0000-000000000000', // 임시 사용자 ID
            content: qualityComments[Math.floor(Math.random() * qualityComments.length)],
            created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
          });
      }

      console.log(`게시글 생성 완료: ${post.title}`);
    }

    console.log('고퀄리티 커뮤니티 글 생성 완료!');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

createQualityPosts();
