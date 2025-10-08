import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin' && profile?.role !== 'master') {
      return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
    }

    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return NextResponse.json({ 
        success: false, 
        message: '이미지 URL이 필요합니다.' 
      }, { status: 400 });
    }

    // 강화된 이미지 검증 로직
    const validationResult = await validateImageAdvanced(imageUrl);
    
    return NextResponse.json({ 
      success: true, 
      data: validationResult
    });

  } catch (error) {
    console.error('이미지 검증 중 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

async function validateImageAdvanced(imageUrl: string) {
  const warnings: string[] = [];
  const details: any = {};
  let riskLevel: 'safe' | 'low' | 'medium' | 'high' = 'safe';
  let riskScore = 0; // 0-100 점수

  try {
    console.log('=== 이미지 검증 시작 ===');
    console.log('이미지 URL:', imageUrl);

    // 1. 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      warnings.push('이미지를 다운로드할 수 없습니다');
      return { warnings, riskLevel: 'high', riskScore: 100, details };
    }

    const contentType = imageResponse.headers.get('content-type');
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageSize = buffer.length;
    
    details.fileSize = `${(imageSize / 1024).toFixed(2)} KB`;
    details.contentType = contentType;

    // 2. 파일 타입 검증
    if (!contentType?.startsWith('image/')) {
      warnings.push('❌ 유효한 이미지 파일이 아닙니다');
      riskScore += 50;
      riskLevel = 'high';
    }

    // 3. EXIF 데이터 추출 및 분석
    const exifData = await extractEXIFData(buffer);
    console.log('EXIF 데이터:', exifData);
    
    if (exifData.hasEXIF) {
      details.hasEXIF = true;
      details.camera = exifData.camera;
      details.software = exifData.software;
      details.dateTime = exifData.dateTime;
      
      // EXIF 있으면 안전도 증가
      console.log('✅ EXIF 데이터 존재 - 실제 촬영 이미지 가능성 높음');
      
      // 카메라 정보가 있으면 더 안전
      if (exifData.camera) {
        console.log('✅ 카메라 정보:', exifData.camera);
        details.cameraInfo = exifData.camera;
      }
      
      // 소프트웨어로 편집된 흔적 확인
      if (exifData.software) {
        const suspiciousSoftware = ['photoshop', 'gimp', 'paint.net', 'canva', 'figma', 'sketch'];
        const softwareLower = exifData.software.toLowerCase();
        
        if (suspiciousSoftware.some(sw => softwareLower.includes(sw))) {
          warnings.push(`⚠️ 편집 소프트웨어 사용 흔적: ${exifData.software}`);
          riskScore += 20;
          if (riskLevel === 'safe') riskLevel = 'low';
        }
      }
      
      // 날짜가 최근인지 확인 (3개월 이상 오래된 사진)
      if (exifData.dateTime) {
        const photoDate = new Date(exifData.dateTime);
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        
        if (photoDate < threeMonthsAgo) {
          warnings.push(`⚠️ 오래된 사진 (촬영일: ${exifData.dateTime})`);
          riskScore += 15;
          if (riskLevel === 'safe') riskLevel = 'low';
        }
      }
    } else {
      // EXIF 없으면 의심
      warnings.push('❌ EXIF 데이터 없음 - 스크린샷, 편집, 또는 다운로드 이미지 가능성 높음');
      riskScore += 40;
      riskLevel = 'medium';
      details.hasEXIF = false;
      console.log('⚠️ EXIF 데이터 없음');
    }

    // 4. URL 분석
    const urlObj = new URL(imageUrl);
    details.domain = urlObj.hostname;
    
    // Supabase Storage 확인 (우리 서버)
    if (urlLower.includes('supabase.co/storage')) {
      console.log('✅ Supabase Storage 업로드 이미지');
      details.uploadSource = 'Supabase Storage';
    } else {
      warnings.push('⚠️ 외부 URL 이미지');
      riskScore += 15;
    }

    // 5. 파일명 분석
    const filename = imageUrl.split('/').pop()?.toLowerCase() || '';
    details.filename = filename;
    
    // 랜덤 숫자/문자 조합 (우리가 생성하는 파일명 패턴)
    const isRandomFilename = filename.match(/^0\.\d+\.webp$/);
    if (isRandomFilename) {
      console.log('✅ 자동 생성 파일명 (우리 시스템)');
    } else {
      // 일반적인 파일명
      if (filename.match(/^(img|image|photo|pic)_?\d+\.(jpg|png)$/)) {
        warnings.push('⚠️ 일반 이미지 파일명 패턴');
        riskScore += 5;
      }
    }

    // 6. 이미지 바이너리 패턴 분석
    const imageAnalysis = analyzeImageBinary(buffer);
    
    if (imageAnalysis.hasScreenshotMarkers) {
      warnings.push('❌ 스크린샷 특징 감지 (PNG 형식)');
      riskScore += 35;
      if (riskLevel !== 'high') riskLevel = 'medium';
    }

    if (imageAnalysis.hasWatermark) {
      warnings.push('❌ 워터마크 텍스트 감지');
      riskScore += 30;
      if (riskLevel !== 'high') riskLevel = 'medium';
    }

    // 7. 이미지 크기 및 해상도 분석
    if (imageSize < 30 * 1024) { // 30KB 미만
      warnings.push('❌ 이미지가 너무 작습니다 (30KB 미만) - 저품질 또는 캡처 이미지');
      riskScore += 25;
      if (riskLevel !== 'high') riskLevel = 'medium';
    } else if (imageSize < 100 * 1024) { // 100KB 미만
      warnings.push('⚠️ 이미지 품질이 낮습니다 (100KB 미만)');
      riskScore += 10;
      if (riskLevel === 'safe') riskLevel = 'low';
    }

    if (imageSize > 10 * 1024 * 1024) { // 10MB 이상
      warnings.push('⚠️ 이미지가 매우 큽니다 (10MB 이상) - 원본 고해상도');
      riskScore += 5;
    }

    // 5. URL 및 도메인 분석
    const urlLower = imageUrl.toLowerCase();
    // urlObj는 이미 위에서 선언됨
    
    // 스톡 이미지 사이트 확인
    const stockSites = [
      'shutterstock', 'istockphoto', 'gettyimages', 'dreamstime', 
      'depositphotos', 'alamy', 'adobe.stock', 'stocksy'
    ];
    
    for (const site of stockSites) {
      if (urlLower.includes(site)) {
        warnings.push(`❌ 스톡 이미지 사이트 감지: ${site}`);
        riskScore += 40;
        riskLevel = 'high';
      }
    }
    
    // 무료 이미지 사이트 확인
    const freeSites = [
      'pexels', 'unsplash', 'pixabay', 'freepik', 'burst.shopify',
      'reshot', 'rawpixel', 'picjumbo', 'gratisography'
    ];
    
    for (const site of freeSites) {
      if (urlLower.includes(site)) {
        warnings.push(`❌ 무료 이미지 사이트 감지: ${site}`);
        riskScore += 35;
        riskLevel = 'high';
      }
    }

    // 검색엔진 이미지 캐시 확인
    const searchEngines = ['google', 'naver', 'daum', 'bing', 'yahoo'];
    for (const engine of searchEngines) {
      if (urlLower.includes(engine) && (urlLower.includes('image') || urlLower.includes('img'))) {
        warnings.push(`❌ 검색엔진 이미지 캐시: ${engine}`);
        riskScore += 40;
        riskLevel = 'high';
      }
    }

    // 6. 파일명 패턴 분석
    // filename은 이미 위에서 선언됨
    
    // 워터마크 키워드
    if (filename.includes('watermark') || filename.includes('sample') || filename.includes('preview')) {
      warnings.push('❌ 워터마크/샘플/미리보기 이미지');
      riskScore += 30;
      if (riskLevel !== 'high') riskLevel = 'medium';
    }

    // 스톡 이미지 명명 규칙 (예: photo-1234567890.jpg)
    if (filename.match(/^(photo|image|pic|stock)-\d+\.(jpg|jpeg|png)$/)) {
      warnings.push('⚠️ 스톡 이미지 명명 규칙');
      riskScore += 25;
      if (riskLevel !== 'high') riskLevel = 'medium';
    }

    // 스크린샷 패턴 (screenshot, capture, snap 등)
    if (filename.match(/(screenshot|capture|snap|screen|캡처|스크린샷)/)) {
      warnings.push('❌ 스크린샷 파일명 감지');
      riskScore += 35;
      if (riskLevel !== 'high') riskLevel = 'medium';
    }

    // 7. 이미지 헤더 바이트 분석 (파일 시그니처)
    const fileSignature = analyzeFileSignature(buffer);
    details.fileSignature = fileSignature;
    
    if (fileSignature.isScreenshot) {
      warnings.push('❌ 스크린샷으로 의심됨 (메타데이터 패턴)');
      riskScore += 30;
      if (riskLevel !== 'high') riskLevel = 'medium';
    }

    // 8. WebP 변환 여부 확인 (Supabase Storage는 자동 webp 변환)
    if (contentType === 'image/webp' || filename.endsWith('.webp')) {
      // Supabase Storage에서 업로드된 이미지는 webp로 변환됨
      // 이것 자체는 의심스럽지 않음
      details.isWebP = true;
      console.log('✅ WebP 형식 (Supabase Storage 업로드 이미지)');
    }

    // 8. 최종 위험도 계산
    // 최종 점수 조정 (음수 방지)
    if (riskScore < 0) riskScore = 0;
    if (riskScore > 100) riskScore = 100;
    
    if (riskScore >= 70) {
      riskLevel = 'high';
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
    } else if (riskScore >= 15) {
      riskLevel = 'low';
    } else {
      riskLevel = 'safe';
    }

    details.riskScore = riskScore;

    // 9. 최종 판정 메시지
    if (warnings.length === 0) {
      if (exifData.hasEXIF && exifData.camera) {
        warnings.push(`✅ 검증 완료: ${exifData.camera}로 촬영된 실제 이미지`);
      } else if (exifData.hasEXIF) {
        warnings.push('✅ 검증 완료: EXIF 데이터 존재 (촬영 이미지 가능성 높음)');
      } else {
        warnings.push('⚠️ 검증 완료: EXIF 없음 (주의 필요)');
        if (riskLevel === 'safe') riskLevel = 'low';
      }
    }

    console.log('=== 검증 완료 ===');
    console.log('위험도:', riskLevel, '점수:', riskScore);
    console.log('경고:', warnings);

    return {
      warnings,
      riskLevel,
      riskScore,
      details
    };

  } catch (error) {
    console.error('이미지 검증 오류:', error);
    return {
      warnings: ['❌ 검증 중 오류 발생'],
      riskLevel: 'medium' as const,
      riskScore: 50,
      details: { error: error.message }
    };
  }
}

// EXIF 데이터 추출 함수
function extractEXIFData(buffer: Buffer) {
  try {
    // JPEG EXIF 마커 확인 (0xFFD8 = JPEG 시작, 0xFFE1 = EXIF 마커)
    const hasJPEGMarker = buffer[0] === 0xFF && buffer[1] === 0xD8;
    
    if (!hasJPEGMarker) {
      return { hasEXIF: false };
    }

    // EXIF 섹션 찾기
    let offset = 2;
    let hasEXIF = false;
    let camera = null;
    let software = null;
    let dateTime = null;

    while (offset < buffer.length - 1) {
      // 마커 확인
      if (buffer[offset] !== 0xFF) break;
      
      const marker = buffer[offset + 1];
      offset += 2;
      
      // APP1 (EXIF) 마커
      if (marker === 0xE1) {
        const segmentLength = (buffer[offset] << 8) | buffer[offset + 1];
        const segmentData = buffer.slice(offset + 2, offset + segmentLength);
        
        // "Exif\0\0" 헤더 확인
        if (segmentData.toString('ascii', 0, 6) === 'Exif\0\0') {
          hasEXIF = true;
          
          // EXIF 데이터에서 주요 정보 추출 (간단한 버전)
          const exifString = segmentData.toString('ascii');
          
          // 카메라 제조사/모델 찾기
          const cameraPatterns = [
            'Canon', 'Nikon', 'Sony', 'Samsung', 'Apple', 'iPhone',
            'Huawei', 'Xiaomi', 'LG', 'Google', 'Pixel', 'Olympus',
            'Panasonic', 'Fujifilm', 'Leica', 'Pentax'
          ];
          
          for (const pattern of cameraPatterns) {
            if (exifString.includes(pattern)) {
              camera = pattern;
              break;
            }
          }
          
          // 소프트웨어 정보 찾기
          const softwarePatterns = [
            'Photoshop', 'GIMP', 'Paint', 'Lightroom', 'Snapseed',
            'VSCO', 'Instagram', 'Canva', 'PicsArt'
          ];
          
          for (const pattern of softwarePatterns) {
            if (exifString.includes(pattern)) {
              software = pattern;
              break;
            }
          }
          
          // 날짜 정보 찾기 (간단한 패턴 매칭)
          const dateMatch = exifString.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
          if (dateMatch) {
            dateTime = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`;
          }
        }
        
        break;
      }
      
      // 다음 세그먼트로 이동
      if (offset >= buffer.length - 1) break;
      const segmentLength = (buffer[offset] << 8) | buffer[offset + 1];
      offset += segmentLength;
    }

    return {
      hasEXIF,
      camera,
      software,
      dateTime
    };

  } catch (error) {
    console.error('EXIF 추출 오류:', error);
    return { hasEXIF: false };
  }
}

// 이미지 바이너리 패턴 분석
function analyzeImageBinary(buffer: Buffer) {
  const result = {
    hasScreenshotMarkers: false,
    hasWatermark: false
  };

  // PNG 파일 확인 (PNG는 EXIF가 없고 스크린샷에 자주 사용됨)
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  
  if (isPNG) {
    // PNG는 스크린샷 가능성 높음
    result.hasScreenshotMarkers = true;
    
    // PNG 청크 분석 (간단 버전)
    const pngString = buffer.toString('ascii', 0, Math.min(buffer.length, 1000));
    
    // 스크린샷 소프트웨어 흔적
    if (pngString.includes('Screenshot') || pngString.includes('Snagit') || 
        pngString.includes('Lightshot') || pngString.includes('Greenshot')) {
      result.hasScreenshotMarkers = true;
    }
  }

  // 워터마크 텍스트 패턴 찾기 (간단한 검사)
  const textContent = buffer.toString('ascii', 0, Math.min(buffer.length, 5000));
  const watermarkKeywords = ['©', 'copyright', 'watermark', 'Getty', 'Shutterstock'];
  
  for (const keyword of watermarkKeywords) {
    if (textContent.includes(keyword)) {
      result.hasWatermark = true;
      break;
    }
  }

  return result;
}

// 파일 시그니처 분석
function analyzeFileSignature(buffer: Buffer) {
  const signature = buffer.slice(0, 12);
  
  // JPEG
  if (signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF) {
    return { 
      type: 'JPEG',
      isScreenshot: false // JPEG는 보통 카메라 촬영
    };
  }
  
  // PNG
  if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) {
    return { 
      type: 'PNG',
      isScreenshot: true // PNG는 스크린샷 가능성 높음
    };
  }
  
  // WebP
  if (signature.toString('ascii', 0, 4) === 'RIFF' && signature.toString('ascii', 8, 12) === 'WEBP') {
    return { 
      type: 'WebP',
      isScreenshot: false // WebP는 변환된 이미지
    };
  }
  
  return { type: 'Unknown', isScreenshot: false };
}

