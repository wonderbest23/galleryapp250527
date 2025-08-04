import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { data, source } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: '발행할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    console.log(`${source}에서 ${data.length}개의 데이터 발행 시작`);

    const publishedPosts = [];

    for (const item of data) {
      try {
        // scraped_posts 테이블에 저장
        const scrapedData = {
          source: source,
          post_url: item.url || `https://example.com/${Date.now()}-${Math.random()}`,
          title: item.title || '제목 없음',
          thumb_url: item.thumb_url || null,
          summary: generatePostContent(item),
          score: 0,
          used: false
        };

        const { data: post, error: postError } = await supabase
          .from('scraped_posts')
          .insert(scrapedData)
          .select()
          .single();

        if (postError) {
          console.error('포스트 생성 오류:', postError);
          continue;
        }

        publishedPosts.push(post);
        console.log(`포스트 발행 완료: ${item.title}`);

      } catch (error: any) {
        console.error('개별 포스트 발행 오류:', error);
      }
    }

    console.log(`발행 완료: ${publishedPosts.length}/${data.length}개 성공`);

    return NextResponse.json({
      success: true,
      published: publishedPosts.length,
      total: data.length,
      source,
      posts: publishedPosts
    });

  } catch (error: any) {
    console.error('스크랩 데이터 발행 오류:', error);
    return NextResponse.json(
      { error: '발행 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}

// 포스트 내용 생성 함수
function generatePostContent(item: any): string {
  let content = '';

  // 제목
  content += `<h2>${item.title}</h2>\n\n`;

  // 기간 정보
  if (item.date) {
    content += `<p><strong>기간:</strong> ${item.date}</p>\n`;
  }

  // 장소 정보
  if (item.location) {
    content += `<p><strong>장소:</strong> ${item.location}</p>\n`;
  }

  // 설명
  if (item.description) {
    content += `<p>${item.description}</p>\n\n`;
  }

  // 원본 링크
  if (item.url) {
    content += `<p><a href="${item.url}" target="_blank" rel="noopener noreferrer">자세히 보기</a></p>\n`;
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