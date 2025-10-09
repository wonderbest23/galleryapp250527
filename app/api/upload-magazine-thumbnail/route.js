import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { imageUrl, fileName } = await request.json();

    if (!imageUrl || !fileName) {
      return NextResponse.json(
        { error: '이미지 URL과 파일명이 필요합니다.' },
        { status: 400 }
      );
    }

    // 원본 이미지 다운로드
    const { data: originalImage, error: downloadError } = await supabase.storage
      .from('magazine')
      .download(fileName);

    if (downloadError) {
      console.log('원본 이미지 다운로드 실패:', downloadError);
      return NextResponse.json(
        { error: '원본 이미지 다운로드 실패', success: false },
        { status: 200 }
      );
    }

    // 이미지 버퍼로 변환
    const buffer = Buffer.from(await originalImage.arrayBuffer());

    // 썸네일 생성 (600x450px, JPEG 85% 품질)
    const thumbnailBuffer = await sharp(buffer)
      .resize(600, 450)
      .jpeg({ quality: 85 })
      .toBuffer();

    // 썸네일 업로드
    const thumbnailPath = `thumbnails/${fileName.split('/').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('magazine')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.log('썸네일 업로드 실패:', uploadError);
      return NextResponse.json(
        { error: '썸네일 업로드 실패', success: false },
        { status: 200 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from('magazine')
      .getPublicUrl(thumbnailPath);

    return NextResponse.json({
      success: true,
      thumbnailUrl: publicUrl,
      message: '매거진 썸네일 생성 완료'
    });

  } catch (error) {
    console.log('매거진 썸네일 생성 오류:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 200 }
    );
  }
}

