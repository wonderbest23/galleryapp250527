const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleAnnouncements = [
  {
    title: "🎨 아트앤브릿지 서비스 업데이트 안내",
    description: "더 나은 사용자 경험을 위해 주요 기능들이 업데이트되었습니다. 새로운 포인트 시스템과 리워드샵 기능을 확인해보세요.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "📱 모바일 앱 최적화 완료",
    description: "모바일 환경에서의 사용성 개선을 위한 업데이트가 완료되었습니다. 더욱 빠르고 안정적인 서비스를 경험하세요.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "🎯 포인트 시스템 도입",
    description: "이제 전시회 리뷰 작성, 커뮤니티 활동, 작품 구매 시 포인트를 적립할 수 있습니다. 모은 포인트로 다양한 혜택을 받아보세요.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "🛍️ 리워드샵 오픈",
    description: "포인트로 다양한 혜택을 받을 수 있는 리워드샵이 오픈되었습니다. 전시회 할인 쿠폰, 특별 굿즈 등 다양한 상품을 확인해보세요.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "🎪 새로운 전시회 정보 추가",
    description: "국내 주요 갤러리와 미술관의 최신 전시회 정보가 업데이트되었습니다. 다양한 전시회를 둘러보고 관심 있는 작품을 발견해보세요.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "👥 커뮤니티 기능 강화",
    description: "사용자들 간의 소통을 위한 커뮤니티 기능이 강화되었습니다. 전시회 후기, 작품 토론, 아트 정보 공유 등을 통해 더 풍부한 경험을 만들어보세요.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "🔔 알림 설정 기능 추가",
    description: "관심 있는 갤러리나 작가의 새로운 소식을 놓치지 않도록 알림 설정 기능이 추가되었습니다. 마이페이지에서 알림 설정을 확인해보세요.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "🎨 작가 인증 시스템 도입",
    description: "작가들의 정품 작품을 보장하기 위한 인증 시스템이 도입되었습니다. 인증된 작가의 작품을 안전하게 구매하실 수 있습니다.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "💳 결제 시스템 보안 강화",
    description: "더욱 안전한 결제를 위해 결제 시스템의 보안이 강화되었습니다. 모든 결제 정보는 암호화되어 안전하게 처리됩니다.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  },
  {
    title: "🌟 베스트 리뷰어 선정",
    description: "상반기 베스트 리뷰어가 선정되었습니다! 퀄리티 높은 리뷰를 작성해주신 모든 사용자분들께 감사드리며, 특별 혜택을 제공해드립니다.",
    gallery_id: null,
    naver_gallery_url: null,
    user_id: null
  }
];

async function seedAnnouncements() {
  try {
    console.log('공지사항 데이터 생성 시작...');
    
    // 기존 시스템 공지사항 삭제 (gallery_id가 null인 것들)
    const { error: deleteError } = await supabase
      .from('gallery_notification')
      .delete()
      .is('gallery_id', null);
    
    if (deleteError) {
      console.error('기존 공지사항 삭제 오류:', deleteError);
    } else {
      console.log('기존 시스템 공지사항 삭제 완료');
    }
    
    // 새로운 공지사항 삽입
    const { data, error } = await supabase
      .from('gallery_notification')
      .insert(sampleAnnouncements)
      .select();
    
    if (error) {
      console.error('공지사항 삽입 오류:', error);
    } else {
      console.log(`✅ ${data.length}개의 공지사항이 성공적으로 생성되었습니다.`);
      data.forEach((announcement, index) => {
        console.log(`${index + 1}. ${announcement.title}`);
      });
    }
  } catch (error) {
    console.error('공지사항 생성 중 오류 발생:', error);
  }
}

seedAnnouncements();

