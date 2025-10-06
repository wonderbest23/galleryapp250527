const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL이나 Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestData() {
  try {
    console.log('테스트 데이터 추가 시작...');

    // 1. 진행 중인 전시회 조회
    const { data: exhibitions, error: exhibitionError } = await supabase
      .from('exhibition')
      .select('id, title, posterimage, gallery(*)')
      .gte('enddate', new Date().toISOString())
      .order('startdate', { ascending: true })
      .limit(1);

    if (exhibitionError) {
      console.error('전시회 조회 오류:', exhibitionError);
      return;
    }

    let testImageUrl = '/noimage.jpg';
    let testTitle = '전시회 무료 관람권';
    let testDescription = '아트앤브릿지에서 제공하는 전시회 무료 관람권입니다. 포인트로 구매하여 전시회를 무료로 관람하세요!';

    if (exhibitions && exhibitions.length > 0) {
      const exhibition = exhibitions[0];
      testImageUrl = exhibition.posterimage || '/noimage.jpg';
      testTitle = `${exhibition.title} 무료 관람권`;
      testDescription = `${exhibition.gallery?.name || '갤러리'}에서 진행 중인 "${exhibition.title}" 전시회 무료 관람권입니다. 포인트로 구매하여 전시회를 무료로 관람하세요!`;
      console.log('전시회 정보:', exhibition.title);
    } else {
      console.log('진행 중인 전시회가 없습니다. 기본 테스트 데이터를 사용합니다.');
    }

    // 2. 리워드샵 테스트 상품 추가
    const testItems = [
      {
        title: testTitle,
        description: testDescription,
        image_url: testImageUrl,
        points_required: 1000,
        stock: 10,
        is_active: true,
        category: 'ticket',
      },
      {
        title: '아트앤브릿지 굿즈 세트',
        description: '아트앤브릿지 로고가 새겨진 특별 굿즈 세트입니다. 에코백, 노트, 펜이 포함되어 있습니다.',
        image_url: '/logo/logo.png',
        points_required: 5000,
        stock: 5,
        is_active: true,
        category: 'goods',
      },
      {
        title: 'VIP 전시회 패스',
        description: '1개월간 모든 전시회를 무료로 관람할 수 있는 VIP 패스입니다.',
        image_url: testImageUrl,
        points_required: 10000,
        stock: 3,
        is_active: true,
        category: 'special',
      }
    ];

    const { data: insertedItems, error: insertError } = await supabase
      .from('reward_shop_items')
      .insert(testItems)
      .select();

    if (insertError) {
      console.error('테스트 데이터 추가 오류:', insertError);
      return;
    }

    console.log('테스트 데이터가 성공적으로 추가되었습니다!');
    console.log(`추가된 상품 수: ${insertedItems.length}`);
    insertedItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} - ${item.points_required}P`);
    });

    // 3. 테스트 사용자에게 포인트 추가 (선택 사항)
    console.log('\n테스트 사용자에게 포인트를 추가하시겠습니까?');
    console.log('Supabase 대시보드에서 직접 profiles 테이블의 points 컬럼을 수정하세요.');
    console.log('예: UPDATE profiles SET points = 10000 WHERE email = \'test@example.com\';');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

addTestData();

