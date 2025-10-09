const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabase = createClient(
  'https://teaelrzxuigiocnukwha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYWVscnp4dWlnaW9jbnVrd2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4OTMxMiwiZXhwIjoyMDU3MTY1MzEyfQ.leaLPRZDAN8zS1F2ijIZSp0HrBA7A5Fqgef_6QSa_S4'
);

const BUCKET = 'magazine';

async function generateMagazineThumbnailsFixed() {
  console.log('매거진 썸네일 생성 시작 (올바른 경로)...');
  
  // magazine/magazine/ 폴더의 파일들을 가져오기
  const { data: files, error } = await supabase.storage.from(BUCKET).list('magazine', { limit: 1000 });
  if (error) {
    console.error('파일 리스트 가져오기 오류:', error);
    return;
  }

  console.log(`총 ${files.length}개 파일 발견`);

  for (const file of files) {
    if (file.name.startsWith('thumbnails/')) {
      console.log(`이미 썸네일: ${file.name}`);
      continue;
    }
    if (!file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      console.log(`이미지 파일 아님: ${file.name}`);
      continue;
    }

    try {
      console.log(`처리 중: magazine/${file.name}`);
      
      // 이미지 다운로드 (magazine/magazine/ 경로)
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(`magazine/${file.name}`);
      
      if (downloadError) {
        console.error(`다운로드 오류 (magazine/${file.name}):`, downloadError);
        continue;
      }

      // 썸네일 생성
      const buffer = Buffer.from(await data.arrayBuffer());
            const thumbnail = await sharp(buffer)
              .resize(600, 450) // 썸네일 크기
              .jpeg({ quality: 85 }) // JPEG 품질
              .toBuffer();

      // 썸네일 업로드 (thumbnails/ 경로)
      const thumbPath = `thumbnails/${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbnail, {
        upsert: true,
        contentType: 'image/jpeg'
      });

      if (uploadError) {
        console.error(`썸네일 업로드 오류 (${thumbPath}):`, uploadError);
      } else {
        console.log(`✅ 썸네일 생성 완료: ${thumbPath}`);
      }
    } catch (error) {
      console.error(`처리 실패 (${file.name}):`, error.message);
    }
  }
  
  console.log('🎉 매거진 썸네일 생성 완료!');
}

generateMagazineThumbnailsFixed().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('스크립트 실행 중 오류 발생:', err);
  process.exit(1);
});
