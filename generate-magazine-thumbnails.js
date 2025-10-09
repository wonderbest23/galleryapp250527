const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4OTMxMiwiZXhwIjoyMDU3MTY1MzEyfQ.leaLPRZDAN8zS1F2ijIZSp0HrBA7A5Fqgef_6QSa_S4'
);

const BUCKET = 'magazine'; // 매거진 버킷만

async function generateMagazineThumbnails() {
  console.log('매거진 썸네일 생성 시작...');
  
  // 1. 매거진 버킷의 모든 이미지 리스트 가져오기
  const { data: files, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  if (error) {
    console.error('파일 리스트 가져오기 실패:', error);
    return;
  }

  console.log(`총 ${files.length}개 파일 발견`);

  for (const file of files) {
    if (file.name.startsWith('thumbnails/')) {
      console.log(`이미 썸네일 존재: ${file.name}`);
      continue; // 이미 썸네일이면 건너뜀
    }
    
    if (!file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      console.log(`이미지 파일 아님: ${file.name}`);
      continue; // 이미지 파일만
    }

    try {
      console.log(`처리 중: ${file.name}`);
      
      // 2. 이미지 다운로드
      const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(file.name);
      if (downloadError) {
        console.error(`다운로드 실패: ${file.name}`, downloadError);
        continue;
      }

      // 3. sharp로 썸네일 생성 (매거진용으로 작게)
      const buffer = Buffer.from(await data.arrayBuffer());
      const thumbnail = await sharp(buffer)
        .resize(200, 150) // 매거진용으로 더 작게
        .jpeg({ quality: 60 }) // 품질 낮춤
        .toBuffer();

      // 4. 썸네일 업로드
      const thumbPath = `thumbnails/${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbnail, {
        upsert: true,
        contentType: 'image/jpeg'
      });

      if (uploadError) {
        console.error(`업로드 실패: ${thumbPath}`, uploadError);
        continue;
      }

      console.log(`✅ 썸네일 생성 완료: ${thumbPath}`);
    } catch (error) {
      console.error(`처리 실패: ${file.name}`, error.message);
    }
  }
}

generateMagazineThumbnails().then(() => {
  console.log('🎉 매거진 썸네일 생성 완료!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 썸네일 생성 중 오류:', error);
  process.exit(1);
});
