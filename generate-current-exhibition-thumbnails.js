const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4OTMxMiwiZXhwIjoyMDU3MTY1MzEyfQ.leaLPRZDAN8zS1F2ijIZSp0HrBA7A5Fqgef_6QSa_S4'
);

const BUCKET = 'exhibition';

async function generateCurrentExhibitionThumbnails() {
  console.log('현재 진행중인 전시회 썸네일 생성 시작...');
  
  // 진행중인 전시회 2개만 가져오기 (메인화면에 표시되는 것들)
  const { data: exhibitions, error } = await supabase
    .from('exhibition')
    .select('id, contents, photo')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(2);
  
  if (error) {
    console.error('전시회 데이터 가져오기 오류:', error);
    return;
  }

  console.log(`진행중인 전시회 ${exhibitions.length}개 발견`);

  for (const exhibition of exhibitions) {
    console.log(`\n처리 중: ${exhibition.contents} (ID: ${exhibition.id})`);
    
    if (!exhibition.photo) {
      console.log('이미지가 없습니다.');
      continue;
    }

    // base64 이미지는 건너뛰기
    if (exhibition.photo.startsWith('data:')) {
      console.log('base64 이미지는 건너뜁니다.');
      continue;
    }

    // 이미지 파일명 추출
    const photoUrl = exhibition.photo;
    const fileName = photoUrl.split('/').pop();
    
    if (!fileName) {
      console.log('파일명을 추출할 수 없습니다.');
      continue;
    }

    console.log(`파일명: ${fileName}`);

    try {
      // 이미지 다운로드
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(`exhibition/${fileName}`);
      
      if (downloadError) {
        console.error(`다운로드 오류:`, downloadError);
        continue;
      }

      // 썸네일 생성
      const buffer = Buffer.from(await data.arrayBuffer());
            const thumbnail = await sharp(buffer)
              .resize(300, 225) // 썸네일 크기
              .jpeg({ quality: 80 }) // JPEG 품질
              .toBuffer();

      // 썸네일 업로드
      const thumbPath = `thumbnails/${fileName}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbnail, {
        upsert: true,
        contentType: 'image/jpeg'
      });

      if (uploadError) {
        console.error(`썸네일 업로드 오류:`, uploadError);
      } else {
        console.log(`✅ 썸네일 생성 완료: ${thumbPath}`);
      }
    } catch (error) {
      console.error(`처리 실패:`, error.message);
    }
  }
  
  console.log('\n🎉 현재 전시회 썸네일 생성 완료!');
}

generateCurrentExhibitionThumbnails().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('스크립트 실행 중 오류 발생:', err);
  process.exit(1);
});
