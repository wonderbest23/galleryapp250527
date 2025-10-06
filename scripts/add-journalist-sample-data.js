const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addJournalistSampleData() {
  try {
    console.log('기자단 샘플 데이터 추가 시작...');

    // 기자단 프로필 데이터
    const journalistProfiles = [
      {
        name: "김민준",
        title: "전시 해설가",
        bio: "10년 경력의 미술 전시 전문가로, 현대미술의 깊이 있는 해석을 제공합니다.",
        is_featured: true,
        profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        name: "이서연",
        title: "아트 칼럼니스트",
        bio: "예술과 문화를 연결하는 글쓰기로 독자들에게 새로운 시각을 제시합니다.",
        is_featured: true,
        profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
      },
      {
        name: "박지훈",
        title: "사진 전문 기자",
        bio: "전시회 현장의 생생한 순간을 카메라로 담아내는 포토저널리스트입니다.",
        is_featured: true,
        profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      }
    ];

    // 기자단 프로필 삽입
    const { data: profiles, error: profileError } = await supabase
      .from('journalist_profiles')
      .insert(journalistProfiles)
      .select();

    if (profileError) {
      console.error('기자단 프로필 삽입 오류:', profileError);
      return;
    }

    console.log('기자단 프로필 추가 완료:', profiles.length, '개');

    // 기자단 기사 데이터
    const journalistArticles = [
      {
        journalist_id: profiles[0].id,
        title: "빛의 마법사, 제임스 터렐의 공간 탐험기",
        content: "제임스 터렐의 작품은 빛과 공간의 경계를 허물며, 관람자로 하여금 새로운 지각의 세계로 안내한다. 그의 작품을 통해 우리는 빛이 만들어내는 환상과 현실 사이의 경계를 경험하게 된다.",
        excerpt: "제임스 터렐의 작품은 빛과 공간의 경계를 허물며, 관람자로 하여금 새로운 지각의 세계로 안내한다...",
        cover_image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop",
        likes_count: 152,
        views_count: 1200
      },
      {
        journalist_id: profiles[1].id,
        title: "AI가 그린 초상, 현대미술의 새로운 지평을 엿보다",
        content: "인공지능이 창작한 예술 작품들이 미술계에 새로운 화두를 던지고 있다. 기술과 예술의 만남이 만들어내는 새로운 가능성과 그 한계를 살펴본다.",
        excerpt: "인공지능이 창작한 예술 작품들이 미술계에 새로운 화두를 던지고 있다...",
        cover_image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
        likes_count: 98,
        views_count: 890
      },
      {
        journalist_id: profiles[2].id,
        title: "전시회 현장에서 만난 감동의 순간들",
        content: "전시회 현장에서 포착한 특별한 순간들을 사진과 함께 소개한다. 작가와 관람자, 작품과 공간이 만나는 그 순간의 마법을 담아냈다.",
        excerpt: "전시회 현장에서 포착한 특별한 순간들을 사진과 함께 소개한다...",
        cover_image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
        likes_count: 76,
        views_count: 650
      }
    ];

    // 기자단 기사 삽입
    const { data: articles, error: articleError } = await supabase
      .from('journalist_articles')
      .insert(journalistArticles)
      .select();

    if (articleError) {
      console.error('기자단 기사 삽입 오류:', articleError);
      return;
    }

    console.log('기자단 기사 추가 완료:', articles.length, '개');
    console.log('기자단 샘플 데이터 추가 완료!');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

addJournalistSampleData();
