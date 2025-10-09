const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'reviews';

async function generateReviewThumbnails() {
  console.log('리뷰 이미지 썸네일 생성 시작...');
  
  // reviews 폴더의 모든 파일 목록 가져오기
  const { data: files, error } = await supabase.storage.from(BUCKET).list('reviews/', { limit: 1000 });
  if (error) {
    console.error('파일 리스트 가져오기 실패:', error);
    return;
  }

  console.log(`총 ${files.length}개 파일 발견`);
  console.log('발견된 파일들:', files.map(f => f.name));

  for (const file of files) {
    // 이미 썸네일인 경우 건너뛰기
    if (file.name.startsWith('thumbnails/')) {
      console.log(`이미 썸네일 존재: ${file.name}`);
      continue;
    }
    
    // 이미지 파일이 아닌 경우 건너뛰기
    if (!file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      console.log(`이미지 파일 아님: ${file.name}`);
      continue;
    }

    try {
      console.log(`처리 중: ${file.name}`);
      
      // 원본 이미지 다운로드 (올바른 경로)
      const fullPath = `reviews/${file.name}`;
      const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(fullPath);
      if (downloadError) {
        console.error(`다운로드 실패: ${file.name}`, downloadError);
        continue;
      }

      // 이미지 버퍼로 변환
      const buffer = Buffer.from(await data.arrayBuffer());
      
            // 썸네일 생성 (500x500px, JPEG 90% 품질) - 리뷰 카드에 맞는 크기
            const thumbnailBuffer = await sharp(buffer)
              .resize(500, 500)
              .jpeg({ quality: 90 })
              .toBuffer();

      // 썸네일 업로드
      const thumbPath = `thumbnails/${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbnailBuffer, {
        upsert: true,
        contentType: 'image/jpeg'
      });

      if (uploadError) {
        console.error(`썸네일 업로드 실패: ${thumbPath}`, uploadError);
        continue;
      }
      
      console.log(`✅ 썸네일 생성 완료: ${thumbPath}`);
    } catch (error) {
      console.error(`처리 실패: ${file.name}`, error.message);
    }
  }
  
  console.log('🎉 리뷰 이미지 썸네일 생성 완료!');
}

generateReviewThumbnails().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ 스크립트 실행 중 오류:', error);
  process.exit(1);
});
