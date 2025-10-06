import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('video');
    
    if (!file) {
      return NextResponse.json(
        { error: '비디오 파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 유효성 검사
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: '비디오 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검사 (100MB 제한)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기는 100MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 고유한 파일명 생성
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `community-videos/${fileName}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('community-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json(
        { error: '비디오 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('community-videos')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
