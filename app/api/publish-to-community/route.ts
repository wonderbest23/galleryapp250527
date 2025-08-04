import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { data, deleteFromScraped = true } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: '발행할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    console.log(`${data.length}개의 스크랩 데이터를 community에 발행 시작`);

    const publishedPosts = [];
    const scrapedIds = [];

    for (const item of data) {
      try {
        // community_post 테이블에 포스트 생성
        const postData = {
          title: item.title || '제목 없음',
          content: generatePostContent(item, item.images || []),
          user_id: null, // 시스템 발행
          likes: 0,
          views: 0,
          created_at: new Date().toISOString(),
          is_ai_generated: true,
          category: 'exhibition'
        };

        const { data: post, error: postError } = await supabase
          .from('community_post')
          .insert(postData)
          .select()
          .single();

        if (postError) {
          console.error('포스트 생성 오류:', postError);
          continue;
        }

        publishedPosts.push(post);
        scrapedIds.push(item.id);
        console.log(`포스트 발행 완료: ${item.title}`);

      } catch (error: any) {
        console.error('개별 포스트 발행 오류:', error);
      }
    }

    // 스크랩 데이터에서 삭제 (옵션)
    if (deleteFromScraped && scrapedIds.length > 0) {
      try {
        const { error: deleteError } = await supabase
          .from('scraped_posts')
          .delete()
          .in('id', scrapedIds);

        if (deleteError) {
          console.error('스크랩 데이터 삭제 오류:', deleteError);
        } else {
          console.log(`${scrapedIds.length}개의 스크랩 데이터 삭제 완료`);
        }
      } catch (error: any) {
        console.error('스크랩 데이터 삭제 오류:', error);
      }
    }

    console.log(`발행 완료: ${publishedPosts.length}/${data.length}개 성공`);

    return NextResponse.json({
      success: true,
      published: publishedPosts.length,
      total: data.length,
      deletedFromScraped: deleteFromScraped ? scrapedIds.length : 0,
      posts: publishedPosts
    });

  } catch (error: any) {
    console.error('community 발행 오류:', error);
    return NextResponse.json(
      { error: '발행 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}

// 포스트 내용 생성 함수
function generatePostContent(item: any, images: string[] = []): string {
  let content = '';

  // 제목
  content += `<h2>${item.title}</h2>\n\n`;

  // 이미지 추가
  if (images.length > 0) {
    content += `<div class="exhibition-images">\n`;
    images.slice(0, 3).forEach((imageUrl, index) => {
      content += `  <img src="${imageUrl}" alt="${item.title} 이미지 ${index + 1}" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;" />\n`;
    });
    content += `</div>\n\n`;
  }

  // 상세 내용이 있으면 사용, 없으면 기본 요약 사용
  if (item.detailedContent) {
    content += item.detailedContent;
  } else if (item.summary) {
    content += `<p>${item.summary}</p>\n\n`;
    
    // 기간 정보 (summary에서 추출)
    const dateMatch = item.summary?.match(/(\d{4}\.\d{2}\.\d{2}\s*~\s*\d{4}\.\d{2}\.\d{2})/);
    if (dateMatch) {
      content += `<p><strong>기간:</strong> ${dateMatch[1]}</p>\n`;
    }

    // 장소 정보 (summary에서 추출)
    const locationMatch = item.summary?.match(/장소:\s*([^,]+)/);
    if (locationMatch) {
      content += `<p><strong>장소:</strong> ${locationMatch[1]}</p>\n`;
    }
  }

  // 원본 링크
  if (item.post_url) {
    content += `<p><a href="${item.post_url}" target="_blank" rel="noopener noreferrer">자세히 보기</a></p>\n`;
  }

  // 출처 정보
  content += `<hr>\n<p><em>출처: ${getSourceName(item.source)}</em></p>`;

  return content;
}

// 출처 이름 변환 함수
function getSourceName(source: string): string {
  switch (source) {
    case 'visitSeoul':
      return 'Visit Seoul';
    case 'culturePortal':
      return '문화포털';
    case 'artCenter':
      return '예술의전당';
    default:
      return source;
  }
} 